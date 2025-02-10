import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { DatabaseState, DatabaseStateManager, TableData } from './database-state';

@Injectable()
export class ChangesHandler {
  private readonly logger = new Logger(ChangesHandler.name);

  constructor(private databaseStateManager: DatabaseStateManager) {}

  async resolveConflicts(currentData: Uint8Array | undefined, changeSet: any): Promise<Buffer> {
    let currentState = this.databaseStateManager.createEmptyState();

    if (currentData) {
      try {
        currentState = this.databaseStateManager.deserializeState(currentData);
        this.logger.debug(`Current database state parsed, version: ${currentState.version}`);
      } catch (error) {
        this.logger.error('Error parsing current database state', {
          error: error.message,
          stack: error.stack
        });
        throw new InternalServerErrorException('Failed to parse database state');
      }
    }

    const mergedState: DatabaseState = {
      version: Math.max(currentState.version, changeSet.version),
      timestamp: Math.max(currentState.timestamp, changeSet.timestamp),
      insertions: this.mergeTableChanges(currentState.insertions, changeSet.insertions),
      updates: this.mergeTableChanges(currentState.updates, changeSet.updates),
      deletions: this.mergeTableChanges(currentState.deletions, changeSet.deletions),
      lastModified: new Date().toISOString(),
    };

    return Buffer.from(JSON.stringify(mergedState));
  }

  private isValidDatabaseState(data: any): data is DatabaseState {
    return (
      typeof data === 'object' &&
      typeof data.version === 'number' &&
      typeof data.timestamp === 'number' &&
      typeof data.insertions === 'object' &&
      typeof data.updates === 'object' &&
      typeof data.deletions === 'object' &&
      typeof data.lastModified === 'string'
    );
  }

  private mergeTableChanges(
    currentChanges: Record<string, TableData>,
    newChanges: Record<string, TableData>
  ): Record<string, TableData> {
    const mergedChanges: Record<string, TableData> = { ...currentChanges };

    for (const [tableName, tableData] of Object.entries(newChanges)) {
      if (!mergedChanges[tableName]) {
        mergedChanges[tableName] = { rows: [] };
      }

      const existingRowsMap = new Map(
        mergedChanges[tableName].rows.map((row) => [row.row_id, row])
      );

      for (const newRow of tableData.rows) {
        const parsedRow = typeof newRow === 'string' ? JSON.parse(newRow) : newRow;
        if (!parsedRow.originalId) {
          parsedRow.originalId = parsedRow.row_id;
          this.logger.warn('Row missing originalId, using row_id as originalId');
        }
        existingRowsMap.set(parsedRow.row_id, parsedRow);
      }

      mergedChanges[tableName].rows = Array.from(existingRowsMap.values());
    }

    return mergedChanges;
  }
}