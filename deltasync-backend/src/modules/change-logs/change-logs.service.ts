import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesHandler } from './changes-handler';
import { AppUser, Device } from '@prisma/client';

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
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);

  constructor(
    private prisma: PrismaService,
    private changesHandler: ChangesHandler,
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
      const updatedData = await this.resolveConflicts(userDb.data, changeSet);
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

      // 6. Notify other devices
      await this.addToChangeQueue(userIdentifier, deviceId, changeSet);
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

  async fetchMissingChanges(device: Device, appUser: AppUser, data: { lastProcessedChangeId: string }) {
    // TODO: Return changes that came after lastProcessedChangeId
  }

  private async createOrFindChangeLog(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.debug('Checking for existing change log within last 100s');

    if (!this.isValidUUID(userIdentifier)) {
      throw new Error('Invalid user identifier format');
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

    return await this.prisma.changeLog.create({
      data: {
        userIdentifier,
        deviceId,
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
        data: Buffer.from(JSON.stringify({
          version: 0,
          timestamp: Date.now(),
          operations: [],
          lastModified: new Date().toISOString(),
        })),
        lastSyncedAt: new Date(),
      },
    });
  }

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: ChangeSetDto): Promise<Buffer> {
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

        // Validate parsed data structure
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

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async addToChangeQueue(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    if (!this.isValidUUID(userIdentifier)) {
      throw new Error('Invalid user identifier format');
    }

    const sourceDevice = await this.prisma.device.findFirst({
      where: { deviceId, userIdentifier }
    });

    if (!sourceDevice) {
      throw new Error(`Source device ${deviceId} not found for user ${userIdentifier}`);
    }

    const devices = await this.prisma.device.findMany({
      where: {
        userIdentifier,
        NOT: {
          deviceId
        }
      },
    });

    this.logger.debug(`Found ${devices.length} other devices to notify`, {
      sourceDeviceId: deviceId,
      targetDevices: devices.map(d => d.deviceId)
    });

    for (var device in devices) {
      // TODO: Save an entry to device_change_logs
    }
  }
}
