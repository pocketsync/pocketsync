import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesHandler } from './changes-handler';
import { DatabaseStateManager } from './database-state';
import { ChangeLog, Device } from '@prisma/client';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);

  constructor(
    private prisma: PrismaService,
    private changesHandler: ChangesHandler,
    private databaseStateManager: DatabaseStateManager,
  ) { }

  async processChange(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      // 1. Record the change in the log (if it doesn't already exist)
      const changeLog = await this.createOrFindChangeLog(userIdentifier, deviceId, changeSet);
      this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'}`);

      // 2. Get user's current database state
      const userDb = await this.getOrCreateUserDatabase(userIdentifier);
      this.logger.log(`Retrieved user database state, last synced at ${userDb.lastSyncedAt}`);

      // 3. Apply changes and resolve conflicts
      const updatedData = await this.resolveConflicts(userDb.data, changeSet, deviceId);
      this.logger.log('Conflicts resolved, merging changes into database');

      // 4. Update the server-side database
      await this.prisma.userDatabase.update({
        where: { userIdentifier },
        data: {
          data: updatedData,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 5. Mark the change as processed
      await this.prisma.changeLog.update({
        where: { id: changeLog.id },
        data: { processedAt: new Date() },
      });

      this.logger.log('Change processing completed successfully');

      return changeLog;
    } catch (error) {
      this.logger.error('Error processing change', {
        error: error.message,
        userIdentifier,
        deviceId,
        stack: error.stack
      });
      throw new InternalServerErrorException('Error processing change');
    }
  }

  async fetchMissingChanges(device: Device, data: { lastProcessedChangeId: number }): Promise<ChangeLog[]> {
    this.logger.debug(`Fetching changes after ID ${data.lastProcessedChangeId} for device ${device.deviceId}`);

    return this.prisma.changeLog.findMany({
      where: {
        userIdentifier: device.userIdentifier,
        id: { gt: data.lastProcessedChangeId },
        processedAt: { not: null },
        NOT: { deviceId: device.deviceId }
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  private async createOrFindChangeLog(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.debug('Checking for existing change log within last 100s');

    const globalIds = new Set<string>();
    ['insertions', 'updates', 'deletions'].forEach(changeType => {
      const tables = changeSet[changeType] as Record<string, { rows?: Array<any> }>;

      if (tables) {
        Object.values(tables).forEach(table => {
          if (table?.rows?.length) {
            table.rows.forEach(row => {
              const globalId = row.global_id;
              if (!globalId) {
                this.logger.error('Row missing global_id', { row: JSON.stringify(row) });
                throw new Error('Row missing global_id');
              }
              globalIds.add(globalId);
            });
          }
        });
      }
    });

    if (globalIds.size === 0) {
      this.logger.error('No global IDs found in change set', { changeSet: JSON.stringify(changeSet) });
      throw new Error('No row IDs found in change set');
    }

    const device = await this.prisma.device.findFirst({
      where: {
        deviceId,
        userIdentifier,
      },
      select: {
        userIdentifier: true,
        appUser: {
          select: {
            userIdentifier: true
          }
        }
      }
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found for user ${userIdentifier}`);
    }

    const existingChangeLog = await this.prisma.changeLog.findFirst({
      where: {
        userIdentifier,
        deviceId,
        changeSet: { equals: JSON.stringify(changeSet) },
        receivedAt: {
          gte: new Date(Date.now() - 100000),
        },
      },
    });

    if (existingChangeLog) {
      return existingChangeLog;
    }

    // Create a new change log with the first global ID
    const firstGlobalId = Array.from(globalIds)[0];
    this.logger.debug(`Creating new change log with global ID: ${firstGlobalId}`);
    
    return await this.prisma.changeLog.create({
      data: {
        userIdentifier,
        deviceId,
        originalId: firstGlobalId,  // Store the global_id in originalId for backwards compatibility
        changeSet: JSON.stringify(changeSet),
        receivedAt: new Date(),
      },
    });
  }

  private async getOrCreateUserDatabase(userIdentifier: string) {
    return await this.prisma.userDatabase.findFirst({
      where: { userIdentifier },
    }) || await this.prisma.userDatabase.create({
      data: {
        userIdentifier,
        data: this.databaseStateManager.serializeState(
          this.databaseStateManager.createEmptyState()
        ),
        lastSyncedAt: new Date(),
      },
    });
  }

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: ChangeSetDto, deviceId: string): Promise<Buffer> {
    // Extract all row IDs from the incoming change set
    const globalIds = new Set<string>();
    Object.entries(changeSet.insertions).forEach(([tableName, table]) =>
      table.rows.forEach(row => {
        const id = row.global_id;
        if (id) globalIds.add(id);
      })
    );
    Object.entries(changeSet.updates).forEach(([tableName, table]) =>
      table.rows.forEach(row => {
        const id = row.global_id;
        if (id) globalIds.add(id);
      })
    );
    Object.entries(changeSet.deletions).forEach(([tableName, table]) =>
      table.rows.forEach(row => {
        const id = row.global_id;
        if (id) globalIds.add(id);
      })
    );

    // Find pending changes for any of these rows
    const pendingChanges = await this.prisma.changeLog.findMany({
      where: {
        originalId: { in: Array.from(globalIds) },  // Match against global_ids stored in originalId
        processedAt: null,
        receivedAt: { lt: new Date() }
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });

    if (pendingChanges.length > 0) {
      this.logger.debug(`Found ${pendingChanges.length} pending changes for affected rows`);

      // Group all changes by row ID for efficient conflict resolution
      const changesByRow = new Map<string, Array<{ change: any, receivedAt: Date, deviceId?: string }>>();

      // Add pending changes to the map
      pendingChanges.forEach(change => {
        const parsedChangeSet = JSON.parse(change.changeSet as string);
        this.addChangeSetToMap(parsedChangeSet, change.receivedAt, change.deviceId, changesByRow);
      });

      // Add current change set to the map
      this.addChangeSetToMap(changeSet, new Date(), deviceId, changesByRow);

      // Resolve conflicts for each row
      let mergedState = currentData ?
        this.databaseStateManager.deserializeState(currentData) :
        this.databaseStateManager.createEmptyState();

      for (const [rowId, changes] of changesByRow.entries()) {
        // Sort changes by timestamp and device ID
        const sortedChanges = changes.sort((a, b) => {
          const timeComparison = b.receivedAt.getTime() - a.receivedAt.getTime();
          if (timeComparison !== 0) return timeComparison;
          return (b.deviceId || '').localeCompare(a.deviceId || '');
        });

        // Apply the most recent change for this row
        const latestChange = sortedChanges[0];
        mergedState = await this.applyRowChange(mergedState, rowId, latestChange.change);
      }

      return Buffer.from(JSON.stringify(mergedState));
    }

    // If no pending changes, proceed with normal conflict resolution
    return this.changesHandler.resolveConflicts(currentData, changeSet);
  }

  private addChangeSetToMap(
    changeSet: any,
    receivedAt: Date,
    deviceId: string | undefined,
    changesByRow: Map<string, Array<{ change: any, receivedAt: Date, deviceId?: string }>>
  ) {
    const processChanges = (changes: Record<string, any>, type: 'insert' | 'update' | 'delete') => {
      Object.entries(changes).forEach(([tableName, table]) => {
        table.rows.forEach((row: any) => {
          const rowId = row.global_id;
          if (rowId) {
            if (!changesByRow.has(rowId)) {
              changesByRow.set(rowId, []);
            }
            changesByRow.get(rowId)?.push({
              change: { type, row, tableName },
              receivedAt,
              deviceId
            });
          }
        });
      });
    };

    processChanges(changeSet.insertions, 'insert');
    processChanges(changeSet.updates, 'update');
    processChanges(changeSet.deletions, 'delete');
  }

  private async applyRowChange(state: any, rowId: string, change: { type: string, row: any, tableName: string }): Promise<any> {
    // Create a new state object to avoid mutating the input
    const newState = { ...state };
    const table = change.tableName;

    // Apply the change based on its type
    switch (change.type) {
      case 'insert':
      case 'update':
        // Update or insert the row in the appropriate table
        if (!newState[table]) {
          newState[table] = { rows: [] };
        }
        const existingRowIndex = newState[table].rows.findIndex((r: any) =>
          r.global_id === rowId
        );
        if (existingRowIndex >= 0) {
          newState[table].rows[existingRowIndex] = {
            ...change.row,
            global_id: rowId  // Ensure we keep the global_id
          };
        } else {
          newState[table].rows.push({
            ...change.row,
            global_id: rowId  // Ensure we keep the global_id
          });
        }
        break;

      case 'delete':
        // Remove the row from the table
        if (newState[table]) {
          newState[table].rows = newState[table].rows.filter((r: any) =>
            r.global_id !== rowId
          );
        }
        break;
    }

    return newState;
  }
}
