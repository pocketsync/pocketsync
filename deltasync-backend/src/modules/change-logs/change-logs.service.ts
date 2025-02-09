import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from './websocket.gateway';
import { ChangeSetDto } from './dto/change-set.dto';

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
    private wsGateway: WebSocketGateway,
  ) { }

  async processChange(appUserId: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.log(`Processing change for user ${appUserId} from device ${deviceId}`);
    try {
      // 1. Record the change in the log (if it doesn't already exist)
      const changeLog = await this.createOrFindChangeLog(appUserId, deviceId, changeSet);
      this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'}`);

      // 2. Get user's current database state
      const userDb = await this.getOrCreateUserDatabase(appUserId);
      this.logger.log(`Retrieved user database state, last synced at ${userDb.lastSyncedAt}`);

      // 3. Apply changes and resolve conflicts
      const updatedData = await this.resolveConflicts(userDb.data, changeSet);
      this.logger.log('Conflicts resolved, merging changes into database');

      // 4. Update the server-side database
      await this.prisma.userDatabase.update({
        where: { appUserId },
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
      await this.notifyOtherDevices(appUserId, deviceId, changeSet);
      this.logger.log('Change processing completed successfully');

      return changeLog;
    } catch (error) {
      this.logger.error('Error processing change', {
        error: error.message,
        userId: appUserId,
        deviceId,
        stack: error.stack
      });
      throw new InternalServerErrorException('Error processing change');
    }
  }

  private async createOrFindChangeLog(appUserId: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.debug('Checking for existing change log within last 100s');
    
    const device = await this.prisma.device.findFirst({
      where: { deviceId },
      select: { id: true }
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const existingChangeLog = await this.prisma.changeLog.findFirst({
      where: {
        appUserId,
        deviceId: device.id,
        changeSet: { equals: JSON.stringify(changeSet) },
        receivedAt: {
          gte: new Date(Date.now() - 100000),
        },
      },
    });

    return existingChangeLog || await this.prisma.changeLog.create({
      data: {
        appUserId,
        deviceId: device.id,
        changeSet: JSON.stringify(changeSet),
        receivedAt: new Date(),
      },
    });
  }

  private async getOrCreateUserDatabase(appUserId: string) {
    return await this.prisma.userDatabase.findFirst({
      where: { appUserId },
    }) || await this.prisma.userDatabase.create({
      data: {
        appUserId,
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

  private async notifyOtherDevices(appUserId: string, sourceDeviceId: string, changeSet: any) {
    const sourceDevice = await this.prisma.device.findFirst({
      where: { deviceId: sourceDeviceId },
      select: { id: true }
    });

    if (!sourceDevice) {
      throw new Error(`Source device ${sourceDeviceId} not found`);
    }

    const devices = await this.prisma.device.findMany({
      where: {
        appUserId,
        NOT: { id: sourceDevice.id },
      },
    });

    for (const device of devices) {
      // Create a pending change record
      await this.prisma.changeLog.create({
        data: {
          appUserId,
          deviceId: device.id,
          changeSet: JSON.stringify(changeSet),
          receivedAt: new Date(),
        },
      });

      // Attempt to notify the device in real-time
      this.wsGateway.notifyDevice(device.deviceId, {
        type: 'CHANGE_NOTIFICATION',
        data: changeSet,
      });
    }
  }
}
