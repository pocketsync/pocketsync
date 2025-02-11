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

    const changes = await this.prisma.changeLog.findMany({
      where: {
        userIdentifier: device.userIdentifier,
        id: { gt: data.lastProcessedChangeId },
        processedAt: { not: null },
        deviceId: { not: device.deviceId },
      },
      orderBy: {
        id: 'asc'
      }
    });
    this.logger.debug(`Found ${changes.length} changes for ${device.deviceId}`);
    return changes;
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
    const changesByGlobalId = new Map<string, Array<{
      type: 'insert' | 'update' | 'delete',
      tableName: string,
      data: any,
      deviceId: string,
      receivedAt: Date
    }>>();

    // Process incoming changes
    const processTableChanges = (type: 'insert' | 'update' | 'delete', changes: Record<string, any>) => {
      Object.entries(changes).forEach(([tableName, table]) => {
        table.rows.forEach(row => {
          const globalId = row.global_id;
          if (!globalId) {
            this.logger.error('Row missing global_id in conflict resolution', { row: JSON.stringify(row) });
            throw new Error('Row missing global_id in conflict resolution');
          }
          globalIds.add(globalId);

          if (!changesByGlobalId.has(globalId)) {
            changesByGlobalId.set(globalId, []);
          }
          changesByGlobalId.get(globalId)?.push({
            type,
            tableName,
            data: row,
            deviceId,
            receivedAt: new Date()
          });
        });
      });
    };

    processTableChanges('insert', changeSet.insertions);
    processTableChanges('update', changeSet.updates);
    processTableChanges('delete', changeSet.deletions);

    // Find pending changes for any of these rows
    const pendingChanges = await this.prisma.changeLog.findMany({
      where: {
        originalId: { in: Array.from(globalIds) },
        processedAt: null,
        receivedAt: { lt: new Date() }
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });

    if (pendingChanges.length > 0) {
      this.logger.debug(`Found ${pendingChanges.length} pending changes for affected rows`);

      // Add pending changes to our change map
      for (const change of pendingChanges) {
        const parsedChangeSet = JSON.parse(change.changeSet as string);

        const processPendingChanges = (type: 'insert' | 'update' | 'delete', changes: Record<string, any>) => {
          Object.entries(changes).forEach(([tableName, table]) => {
            table.rows.forEach(row => {
              const globalId = row.global_id;
              if (globalId) {
                if (!changesByGlobalId.has(globalId)) {
                  changesByGlobalId.set(globalId, []);
                }
                changesByGlobalId.get(globalId)?.push({
                  type,
                  tableName,
                  data: row,
                  deviceId: change.deviceId,
                  receivedAt: change.receivedAt
                });
              }
            });
          });
        };

        processPendingChanges('insert', parsedChangeSet.insertions);
        processPendingChanges('update', parsedChangeSet.updates);
        processPendingChanges('delete', parsedChangeSet.deletions);
      }

      // Resolve conflicts for each global ID
      let mergedState = currentData ?
        this.databaseStateManager.deserializeState(currentData) :
        this.databaseStateManager.createEmptyState();

      for (const [globalId, changes] of changesByGlobalId.entries()) {
        // Sort changes by timestamp and device ID
        const sortedChanges = changes.sort((a, b) => {
          const timeComparison = b.receivedAt.getTime() - a.receivedAt.getTime();
          if (timeComparison !== 0) return timeComparison;
          return (b.deviceId || '').localeCompare(a.deviceId || '');
        });

        // Apply the most recent change
        const latestChange = sortedChanges[0];
        const tableName = latestChange.tableName;

        if (!mergedState[tableName]) {
          mergedState[tableName] = { rows: [] };
        }

        switch (latestChange.type) {
          case 'insert':
          case 'update':
            const existingRowIndex = mergedState[tableName].rows.findIndex(
              (r: any) => r.global_id === globalId
            );

            if (existingRowIndex >= 0) {
              mergedState[tableName].rows[existingRowIndex] = {
                ...latestChange.data,
                global_id: globalId
              };
            } else {
              mergedState[tableName].rows.push({
                ...latestChange.data,
                global_id: globalId
              });
            }
            break;

          case 'delete':
            mergedState[tableName].rows = mergedState[tableName].rows.filter(
              (r: any) => r.global_id !== globalId
            );
            break;
        }
      }

      return Buffer.from(JSON.stringify(mergedState));
    }

    return this.changesHandler.resolveConflicts(currentData, changeSet);
  }
}
