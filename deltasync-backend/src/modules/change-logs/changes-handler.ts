import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";

interface DatabaseState {
  version: number;
  timestamp: number;
  insertions: Record<string, TableData>;
  updates: Record<string, TableData>;
  deletions: Record<string, TableData>;
  lastModified: string;
}

interface TableData {
  rows: Array<{
    row_id: string;
    [key: string]: any;
  }>;
}

@Injectable()
export class ChangesHandler {
  private readonly logger = new Logger(ChangesHandler.name);

  async resolveConflicts(currentData: Uint8Array | undefined, changeSet: any): Promise<Buffer> {
    let currentState: DatabaseState = {
      version: 0,
      timestamp: Date.now(),
      insertions: {},
      updates: {},
      deletions: {},
      lastModified: new Date().toISOString(),
    };

    if (currentData) {
      try {
        const bufferData = Buffer.from(currentData);
        const parsedData = JSON.parse(bufferData.toString('utf8').trim());

        if (!this.isValidDatabaseState(parsedData)) {
          throw new Error('Invalid database state structure');
        }

        currentState = parsedData;
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
        existingRowsMap.set(parsedRow.row_id, parsedRow);
      }

      mergedChanges[tableName].rows = Array.from(existingRowsMap.values());
    }

    return mergedChanges;
  }
}