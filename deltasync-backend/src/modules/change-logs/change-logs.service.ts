import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class ChangeLogsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebSocketGateway,
  ) { }

  async processChange(appUserId: string, deviceId: string, changeSet: any) {
    // 1. Record the change in the log
    // Check if a similar change log entry already exists
    const existingChangeLog = await this.prisma.changeLog.findFirst({
      where: {
        appUserId,
        deviceId,
        changeSet: {
          path: ['version'],
          equals: changeSet.version
        },
        receivedAt: {
          gte: new Date(Date.now() - 100000), // Look for entries within last 100 seconds
        },
      },
    });

    // Only create new change log if no similar entry exists
    const changeLog = existingChangeLog || await this.prisma.changeLog.create({
      data: {
        appUserId,
        deviceId: deviceId,
        changeSet,
        receivedAt: new Date(),
      },
    });

    // 2. Get user's current database state
    const userDb = await this.prisma.userDatabase.findFirst({
      where: { appUserId },
    }) || await this.prisma.userDatabase.create({
      data: {
        appUserId,
        data: Buffer.from(JSON.stringify({
          version: 0,
          timestamp: Date.now(),
          operations: [],
          lastModified: new Date().toISOString()
        })),
        lastSyncedAt: new Date(),
      }
    });

    try {

      // 3. Apply changes and resolve conflicts
      const updatedData = await this.resolveConflicts(userDb?.data, changeSet);

      // 4. Update the server-side database
      await this.prisma.userDatabase.upsert({
        where: { appUserId },
        create: {
          appUserId,
          data: updatedData,
          lastSyncedAt: new Date(),
        },
        update: {
          data: updatedData,
          lastSyncedAt: new Date(),
        },
      });

      // 5. Mark change as processed
      await this.prisma.changeLog.update({
        where: { id: changeLog.id },
        data: { processedAt: new Date() },
      });

      // 6. Notify other devices
      await this.notifyOtherDevices(appUserId, deviceId, changeSet);

      return changeLog;
    } catch (error) {
      console.error('Error processing change:', error);
      // Handle error appropriately, e.g., log it or throw a custom error
      throw new InternalServerErrorException('Error processing change');
    }
  }

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: any) {
    try {
      // Validate changeSet structure
      if (!changeSet || typeof changeSet !== 'object') {
        throw new Error('Invalid changeSet: must be an object');
      }

      // Ensure required fields exist with defaults
      const version = typeof changeSet.version === 'number' ? changeSet.version : 0;
      const timestamp = typeof changeSet.timestamp === 'number' ? changeSet.timestamp : Date.now();
      const operations = Array.isArray(changeSet.operations) ? changeSet.operations : [];

      // Parse the current database state
      let currentState = {
        version: 0,
        timestamp: 0,
        operations: [],
        lastModified: new Date().toISOString()
      };

      if (currentData && currentData.length > 0) {
        try {
          // Convert Buffer to string and ensure it's properly trimmed
          const dataString = Buffer.from(currentData).toString('utf8').trim();
          if (dataString && dataString !== '{}') {
            const parsedData = JSON.parse(dataString);
            if (typeof parsedData === 'object' && parsedData !== null) {
              currentState = {
                version: typeof parsedData.version === 'number' ? parsedData.version : 0,
                timestamp: typeof parsedData.timestamp === 'number' ? parsedData.timestamp : 0,
                operations: Array.isArray(parsedData.operations) ? parsedData.operations : [],
                lastModified: typeof parsedData.lastModified === 'string' ? parsedData.lastModified : new Date().toISOString()
              };
            }
          }
        } catch (parseError) {
          console.error('Error parsing current database state:', parseError);
          // Continue with default state
        }
      }

      // If current state is empty or new changes are newer
      if (currentState.operations.length === 0 || timestamp > currentState.timestamp) {
        const updatedState = {
          version: Math.max(currentState.version, version),
          timestamp: Math.max(currentState.timestamp, timestamp),
          operations: operations,
          lastModified: new Date().toISOString()
        };
        return Buffer.from(JSON.stringify(updatedState));
      }

      // Merge operations when current state is newer or has same timestamp
      const mergedOperations = this.mergeOperations(currentState.operations, operations);

      const mergedState = {
        version: Math.max(currentState.version, version),
        timestamp: Math.max(currentState.timestamp, timestamp),
        operations: mergedOperations,
        lastModified: new Date().toISOString()
      };

      return Buffer.from(JSON.stringify(mergedState));
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      // Return a safe fallback state
      const fallbackState = {
        version: 0,
        timestamp: Date.now(),
        operations: [],
        lastModified: new Date().toISOString()
      };
      return Buffer.from(JSON.stringify(fallbackState));
    }
  }

  private mergeOperations(currentOps: any[], newOps: any[]): any[] {
    // Create a map of operations by their target (table + row)
    const opsByTarget = new Map();

    // Process all operations in chronological order
    [...currentOps, ...newOps].forEach(op => {
      const target = `${op.table}:${op.rowId}`;
      const existing = opsByTarget.get(target);

      // If no existing operation or new operation is newer, use the new one
      if (!existing || op.timestamp > existing.timestamp) {
        opsByTarget.set(target, op);
      }
    });

    // Convert map back to array
    return Array.from(opsByTarget.values());
  }
  private async notifyOtherDevices(appUserId: string, sourceDeviceId: string, changeSet: any) {
    // Get all other devices of this user
    const devices = await this.prisma.device.findMany({
      where: {
        appUserId,
        NOT: {
          id: sourceDeviceId,
        },
      },
    });

    // Notify each device through WebSocket
    for (const device of devices) {
      this.wsGateway.notifyDevice(device.id, {
        type: 'CHANGE_NOTIFICATION',
        data: changeSet,
      });

      // Record notification attempt
      await this.prisma.changeLog.create({
        data: {
          appUserId,
          deviceId: device.id,
          changeSet,
          receivedAt: new Date(),
          processedAt: new Date(), // Mark as processed since this is a notification
        },
      });
    }
  }
}