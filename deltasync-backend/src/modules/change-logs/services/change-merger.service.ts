import { Injectable, Logger } from '@nestjs/common';
import { ChangeSetDto } from '../dto/change-set.dto';

@Injectable()
export class ChangeMergerService {
  private readonly logger = new Logger(ChangeMergerService.name);
  private readonly MAX_TIMESTAMP_DRIFT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  mergeChangeSets(changeSets: ChangeSetDto[]): ChangeSetDto {
    const mergedChangeSet: ChangeSetDto = {
      insertions: {},
      updates: {},
      deletions: {},
      timestamp: Math.max(...changeSets.map(cs => cs.timestamp)),
      version: Math.max(...changeSets.map(cs => cs.version)),
    };

    // Track the latest version of each record by primary key
    const latestVersions: Record<string, Record<string, {
      row: any;
      timestamp: number;
      version: number;
      changeType: 'insertions' | 'updates' | 'deletions';
    }>> = {};

    // First pass: determine the latest version of each record
    for (const changeSet of changeSets) {
      // Validate timestamp
      if (!this.isValidTimestamp(changeSet.timestamp)) {
        continue;
      }

      // Process deletions first, then updates, then insertions
      for (const changeType of ['deletions', 'updates', 'insertions'] as const) {
        for (const [tableName, tableChanges] of Object.entries(changeSet[changeType])) {
          if (!latestVersions[tableName]) {
            latestVersions[tableName] = {};
          }

          for (const row of tableChanges.rows) {
            const primaryKey = row.primaryKey;
            const timestamp = row.timestamp || changeSet.timestamp;
            const version = row.version || changeSet.version;

            // Apply last-write-wins strategy based on timestamp and version
            if (!latestVersions[tableName][primaryKey] ||
              timestamp > latestVersions[tableName][primaryKey].timestamp ||
              (timestamp === latestVersions[tableName][primaryKey].timestamp &&
                version > latestVersions[tableName][primaryKey].version)) {
              latestVersions[tableName][primaryKey] = {
                row,
                timestamp,
                version,
                changeType
              };
            }
          }
        }
      }
    }

    // Second pass: organize changes by type
    for (const [tableName, versions] of Object.entries(latestVersions)) {
      for (const { row, changeType } of Object.values(versions)) {
        if (!mergedChangeSet[changeType][tableName]) {
          mergedChangeSet[changeType][tableName] = { rows: [] };
        }
        mergedChangeSet[changeType][tableName].rows.push(row);
      }
    }

    return mergedChangeSet;
  }

  private isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    return timestamp <= now && timestamp > now - this.MAX_TIMESTAMP_DRIFT;
  }
}