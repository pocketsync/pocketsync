import { Injectable, Logger } from '@nestjs/common';
import { ChangeSetDto } from '../dto/change-set.dto';
import { ChangeStatsService } from './change-stats.service';

@Injectable()
export class ChangeMergerService {
  private readonly logger = new Logger(ChangeMergerService.name);
  private readonly processedChanges = new Map<string, number>();
  private readonly PROCESSED_CHANGES_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly PROCESSED_CHANGES_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly changeStats: ChangeStatsService
  ) {
    // Cleanup processed changes periodically
    setInterval(() => this.cleanupProcessedChanges(), this.PROCESSED_CHANGES_CLEANUP_INTERVAL);
  }

  async mergeChangeSets(changeSets: ChangeSetDto[]): Promise<ChangeSetDto> {
    const mergedChangeSet: ChangeSetDto = {
      insertions: {},
      updates: {},
      deletions: {},
      timestamp: Math.max(...changeSets.map(cs => cs.timestamp)),
      version: Math.max(...changeSets.map(cs => cs.version)),
    };

    // Track all operations for each record by primary key
    const recordOperations: Record<string, Record<string, {
      operations: Array<'insert' | 'update' | 'delete'>;
      row: any;
      timestamp: number;
      version: number;
      finalOperation: 'insert' | 'update' | 'delete' | null;
    }>> = {};

    // First pass: collect all operations for each record and identify dependencies
    for (const changeSet of changeSets) {
      if (!this.isValidTimestamp(changeSet.timestamp)) {
        this.changeStats.incrementInvalidTimestamp(changeSet.timestamp);
        continue;
      }

      const changeSetHash = this.computeChangeSetHash(changeSet);
      const now = Date.now();
      if (this.processedChanges.has(changeSetHash)) {
        this.logger.debug(`Skipping already processed change set: ${changeSetHash}`);
        continue;
      }

      await this.processChangeSetOperations(changeSet, recordOperations);
      this.processedChanges.set(changeSetHash, now);
    }

    // Second pass: determine final state and organize changes
    await this.organizeFinalChanges(recordOperations, mergedChangeSet);

    return mergedChangeSet;
  }

  private async processChangeSetOperations(
    changeSet: ChangeSetDto,
    recordOperations: Record<string, Record<string, any>>
  ): Promise<void> {
    for (const [operationType, operation] of [
      ['insert', 'insertions'],
      ['update', 'updates'],
      ['delete', 'deletions']
    ] as const) {
      for (const [tableName, tableChanges] of Object.entries(changeSet[operation])) {
        if (!recordOperations[tableName]) {
          recordOperations[tableName] = {};
        }

        for (const row of tableChanges.rows) {
          const primaryKey = row.primaryKey;
          const timestamp = row.timestamp || changeSet.timestamp;
          const version = row.version || changeSet.version;
          const currentRecord = recordOperations[tableName][primaryKey];

          // If no existing record, create a new one
          if (!currentRecord) {
            recordOperations[tableName][primaryKey] = {
              operations: [operationType],
              row,
              timestamp,
              version,
              finalOperation: null,
              previousVersions: []
            };
            continue;
          }

          // Compare timestamps and versions
          const isMoreRecent = timestamp > currentRecord.timestamp ||
            (timestamp === currentRecord.timestamp && version > currentRecord.version);

          // If current operation is more recent
          if (isMoreRecent) {
            // Store the previous version before updating
            currentRecord.previousVersions.push({
              row: currentRecord.row,
              timestamp: currentRecord.timestamp,
              version: currentRecord.version,
              operation: currentRecord.operations[currentRecord.operations.length - 1]
            });

            // Update the record with new data
            currentRecord.row = row;
            currentRecord.timestamp = timestamp;
            currentRecord.version = version;
          } else {
            // If not more recent, store as previous version if it contains different data
            const isDifferentData = JSON.stringify(row) !== JSON.stringify(currentRecord.row);
            if (isDifferentData) {
              currentRecord.previousVersions.push({
                row,
                timestamp,
                version,
                operation: operationType
              });
            }
          }

          currentRecord.operations.push(operationType);
        }
      }
    }
  }

  // TODO: Timestamp is not present in the output data. I need to fix
  private async organizeFinalChanges(
    recordOperations: Record<string, Record<string, any>>,
    mergedChangeSet: ChangeSetDto
  ): Promise<void> {
    // Process all records in timestamp order
    for (const [tableName, records] of Object.entries(recordOperations)) {
      for (const [primaryKey, record] of Object.entries(records)) {
        const finalOperation = this.determineFinalOperation(record.operations);
        if (finalOperation) {
          const changeType = this.getChangeType(finalOperation);
          if (!mergedChangeSet[changeType][tableName]) {
            mergedChangeSet[changeType][tableName] = { rows: [] };
          }
          mergedChangeSet[changeType][tableName].rows.push(record.row);
        }
      }
    }
  }

  private determineFinalOperation(operations: Array<'insert' | 'update' | 'delete'>): 'insert' | 'update' | 'delete' | null {
    if (operations.length === 0) return null;

    const lastOperation = operations[operations.length - 1];

    // If the last operation is delete
    if (lastOperation === 'delete') {
      // If this is the only operation, it's a straightforward delete
      if (operations.length === 1) return 'delete';

      // If the record was inserted in this changeset and later deleted,
      // we can skip broadcasting this change entirely since the net effect
      // is as if the record never existed
      if (operations.includes('insert')) return null;

      // For records that existed before this changeset and were deleted,
      // we need to broadcast the deletion
      return 'delete';
    }

    return lastOperation;
  }

  private getChangeType(operation: 'insert' | 'update' | 'delete'): 'insertions' | 'updates' | 'deletions' {
    const mapping = {
      insert: 'insertions',
      update: 'updates',
      delete: 'deletions'
    } as const;
    return mapping[operation];
  }

  private isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    return timestamp <= now + (5 * 60 * 1000); // Allow 5 minutes into the future
  }

  private computeChangeSetHash(changeSet: ChangeSetDto): string {
    // Extract only essential properties for hash calculation
    const essentialData = {
      timestamp: changeSet.timestamp,
      version: changeSet.version,
      tables: this.extractTableKeys(changeSet)
    };

    return require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(essentialData))
      .digest('hex');
  }

  private extractTableKeys(changeSet: ChangeSetDto): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const operation of ['insertions', 'updates', 'deletions'] as const) {
      for (const [tableName, tableChanges] of Object.entries(changeSet[operation])) {
        if (!result[tableName]) {
          result[tableName] = [];
        }

        for (const row of tableChanges.rows) {
          result[tableName].push(`${row.primaryKey}:${row.version}:${operation}`);
        }
      }
    }

    return result;
  }

  private cleanupProcessedChanges(): void {
    const now = Date.now();
    const expiredCount = Array.from(this.processedChanges.entries())
      .filter(([_, timestamp]) => now - timestamp > this.PROCESSED_CHANGES_TTL)
      .map(([key, _]) => {
        this.processedChanges.delete(key);
        return key;
      }).length;

    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up processed changes cache (removed ${expiredCount} expired entries, remaining: ${this.processedChanges.size})`);
    }
  }
}