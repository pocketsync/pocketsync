import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from './websocket.gateway';
import { ChangeSetDto } from './dto/change-set.dto';

@Injectable()
export class ChangeLogsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebSocketGateway,
  ) { }

  async processChange(appUserId: string, deviceId: string, changeSet: ChangeSetDto) {
    try {
      // 1. Record the change in the log (if it doesn't already exist)
      const changeLog = await this.createOrFindChangeLog(appUserId, deviceId, changeSet);

      // 2. Get user's current database state
      const userDb = await this.getOrCreateUserDatabase(appUserId);

      // 3. Apply changes and resolve conflicts
      const updatedData = await this.resolveConflicts(userDb.data, changeSet);

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

      return changeLog;
    } catch (error) {
      console.error('Error processing change:', error);
      throw new InternalServerErrorException('Error processing change');
    }
  }

  private async createOrFindChangeLog(appUserId: string, deviceId: string, changeSet: ChangeSetDto) {
    const existingChangeLog = await this.prisma.changeLog.findFirst({
      where: {
        appUserId,
        deviceId,
        receivedAt: {
          gte: new Date(Date.now() - 100000),
        },
      },
    });

    return existingChangeLog || await this.prisma.changeLog.create({
      data: {
        appUserId,
        deviceId,
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

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: ChangeSetDto) {
    let currentState = {
      version: 0,
      timestamp: Date.now(),
      insertions: {},
      updates: {},
      deletions: {},
      lastModified: new Date().toISOString(),
    };

    if (currentData) {
      try {
        // Convert Uint8Array to Buffer
        const bufferData = Buffer.from(currentData);
        const parsedData = JSON.parse(bufferData.toString('utf8').trim());
        currentState = { ...currentState, ...parsedData };
      } catch (error) {
        console.error('Error parsing current database state:', error);
      }
    }

    const mergedState = {
      version: Math.max(currentState.version, changeSet.version),
      timestamp: Math.max(currentState.timestamp, changeSet.timestamp),
      insertions: this.mergeTableChanges(currentState.insertions, changeSet.insertions),
      updates: this.mergeTableChanges(currentState.updates, changeSet.updates),
      deletions: this.mergeTableChanges(currentState.deletions, changeSet.deletions),
      lastModified: new Date().toISOString(),
    };

    return Buffer.from(JSON.stringify(mergedState));
  }

  private mergeTableChanges(currentChanges: any, newChanges: any): any {
    const mergedChanges: any = { ...currentChanges };

    for (const [tableName, tableData] of Object.entries(newChanges)) {
      if (!mergedChanges[tableName]) {
        mergedChanges[tableName] = { rows: [] };
      }

      const existingRowsMap = new Map(
        mergedChanges[tableName].rows.map((row: any) => [row.row_id, row]) // Ensure rows remain objects
      );

      for (const newRow of (tableData as any).rows) {
        const parsedRow = typeof newRow === 'string' ? JSON.parse(newRow) : newRow;
        existingRowsMap.set(parsedRow.row_id, parsedRow);
      }

      mergedChanges[tableName].rows = Array.from(existingRowsMap.values());
    }

    return mergedChanges;
  }

  private async notifyOtherDevices(appUserId: string, sourceDeviceId: string, changeSet: any) {
    const devices = await this.prisma.device.findMany({
      where: {
        appUserId,
        NOT: { deviceId: sourceDeviceId },
      },
    });

    for (const device of devices) {
      this.wsGateway.notifyDevice(device.deviceId, {
        type: 'CHANGE_NOTIFICATION',
        data: changeSet,
      });
    }
  }
}
