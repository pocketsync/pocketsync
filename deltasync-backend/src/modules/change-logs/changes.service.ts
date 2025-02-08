import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class ChangesService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebSocketGateway,
  ) {}

  async processChange(appUserId: string, deviceId: string, changeSet: any) {
    // 1. Record the change in the log
    const changeLog = await this.prisma.changeLog.create({
      data: {
        appUserId,
        deviceId,
        changeSet,
        receivedAt: new Date(),
      },
    });

    // 2. Get user's current database state
    const userDb = await this.prisma.userDatabase.findUnique({
      where: { appUserId },
    });

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
  }

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: any) {
    // TODO: Implement your conflict resolution logic here
    // This is where you'll implement your specific conflict resolution strategy
    // For now, we'll just return a simple merged result
    const current = currentData ? JSON.parse(currentData.toString()) : {};
    return Buffer.from(JSON.stringify({ ...current, ...changeSet }));
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