import { Injectable, Logger } from '@nestjs/common';
import { ChangeSetDto } from '../dto/change-set.dto';
import { ChangeStatsService } from './change-stats.service';

@Injectable()
export class ChangeMergerService {
  private readonly logger = new Logger(ChangeMergerService.name);
  private readonly MAX_TIMESTAMP_DRIFT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly processedChanges = new Set<string>();
  private readonly PROCESSED_CHANGES_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

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
      if (this.processedChanges.has(changeSetHash)) {
        this.logger.debug(`Skipping already processed change set: ${changeSetHash}`);
        continue;
      }

      await this.processChangeSetOperations(changeSet, recordOperations);
      this.processedChanges.add(changeSetHash);
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

          if (!recordOperations[tableName][primaryKey] ||
            timestamp > recordOperations[tableName][primaryKey].timestamp ||
            (timestamp === recordOperations[tableName][primaryKey].timestamp &&
              version > recordOperations[tableName][primaryKey].version)) {

            recordOperations[tableName][primaryKey] = {
              operations: [],
              row,
              timestamp,
              version,
              finalOperation: null
            };
          }

          recordOperations[tableName][primaryKey].operations.push(operationType);
        }
      }
    }
  }

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

    if (lastOperation === 'delete') {
      if (operations.length === 1) return 'delete';
      if (operations.includes('insert')) return null;
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
    return timestamp <= now && timestamp > now - this.MAX_TIMESTAMP_DRIFT;
  }

  private computeChangeSetHash(changeSet: ChangeSetDto): string {
    return require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(changeSet))
      .digest('hex');
  }

  private cleanupProcessedChanges(): void {
    const before = this.processedChanges.size;
    this.processedChanges.clear();
    this.logger.debug(`Cleaned up processed changes cache (removed ${before} entries)`);
  }
}