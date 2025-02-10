import { Injectable } from '@nestjs/common';

export interface TableData {
  rows: Array<{
    row_id: string;
    [key: string]: any;
  }>;
}

export interface DatabaseState {
  version: number;
  timestamp: number;
  insertions: Record<string, TableData>;
  updates: Record<string, TableData>;
  deletions: Record<string, TableData>;
  lastModified: string;
}

@Injectable()
export class DatabaseStateManager {
  /**
   * Creates an empty database state with default values
   */
  createEmptyState(): DatabaseState {
    return {
      version: 0,
      timestamp: Date.now(),
      insertions: {},
      updates: {},
      deletions: {},
      lastModified: new Date().toISOString(),
    };
  }

  /**
   * Creates a Buffer from a database state
   */
  serializeState(state: DatabaseState): Buffer {
    return Buffer.from(JSON.stringify(state));
  }

  /**
   * Parses a Buffer into a database state
   * @throws Error if the data is invalid
   */
  deserializeState(data: Uint8Array): DatabaseState {
    const bufferData = Buffer.from(data);
    const parsedData = JSON.parse(bufferData.toString('utf8').trim());
    
    if (!this.isValidDatabaseState(parsedData)) {
      throw new Error('Invalid database state structure');
    }

    return parsedData;
  }

  /**
   * Type guard to validate database state structure
   */
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
}