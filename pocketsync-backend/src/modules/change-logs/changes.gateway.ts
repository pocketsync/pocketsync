import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeLog } from '@prisma/client';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesService } from '../devices/devices.service';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';

@Injectable()
@WebSocketGateway({
    cors: true,
    namespace: 'changes'
})
@UseGuards(SocketAuthGuard)
export class ChangesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChangesGateway.name);
    private readonly BATCH_SIZE = 50;
    private readonly BATCH_DELAY = 1000; // 1 second delay between batches

    @WebSocketServer()
    private server: Server;

    private connectedDevices: Map<string, string> = new Map(); // deviceId -> socketId

    constructor(
        private prisma: PrismaService,
        private readonly devicesService: DevicesService,
        private readonly appUsersService: AppUsersService,
    ) { }

    async handleConnection(client: any) {
        const { device_id, user_id, project_id, last_synced_at } = client.handshake.query;

        if (!device_id || !user_id || !project_id) {
            this.logger.warn('Connection rejected: Missing required parameters');
            client.disconnect();
            return;
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: project_id,
                deletedAt: null
            }
        });

        if (!project) {
            this.logger.warn(`Connection rejected: Invalid project credentials`);
            client.disconnect();
            return;
        }

        await this.appUsersService.getOrCreateUserFromId(user_id, project_id);
        await this.devicesService.getOrCreateDeviceFromId(device_id, user_id, project_id);

        this.connectedDevices.set(device_id, client.id);
        this.logger.log(`Device ${device_id} connected to project ${project_id}`);

        // Convert milliseconds timestamp to Date object
        const lastSyncedDate = last_synced_at ? new Date(parseInt(last_synced_at)) : null;

        // Send any missed changes to the newly connected device
        await this.sendMissedChanges(device_id, user_id, lastSyncedDate);
    }

    handleDisconnect(client: any) {
        const deviceId = Array.from(this.connectedDevices.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];

        if (deviceId) {
            this.connectedDevices.delete(deviceId);
            this.logger.log(`Device ${deviceId} disconnected`);
        }
    }

    @SubscribeMessage('acknowledge-changes')
    async handleAcknowledgeChanges(client: any, payload: { changeIds: number[] }) {
        const deviceId = Array.from(this.connectedDevices.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];

        if (!deviceId) {
            this.logger.warn('Acknowledgment received from unknown device');
            return;
        }

        await this.prisma.device.update({
            where: {
                deviceId_userIdentifier: {
                    deviceId,
                    userIdentifier: deviceId
                }
            },
            data: { lastSeenAt: new Date() }
        });

        this.logger.log(`Device ${deviceId} acknowledged ${payload.changeIds.length} changes`);
    }

    private async sendMissedChanges(deviceId: string, userIdentifier: string, lastSyncedAt: Date | null) {
        const device = await this.prisma.device.findFirst({
            where: { deviceId, userIdentifier }
        });

        if (!device) return;

        const changes = await this.prisma.changeLog.findMany({
            where: {
                userIdentifier: device.userIdentifier,
                OR: [
                    // Get changes processed after last sync
                    { processedAt: lastSyncedAt ? { gte: lastSyncedAt } : undefined },
                    // Get updates to existing records
                    { receivedAt: lastSyncedAt ? { gte: lastSyncedAt } : undefined }
                ],
                deviceId: { not: device.deviceId },
            },
            orderBy: [
                { receivedAt: 'asc' },
                { id: 'asc' }
            ],
        });

        if (changes.length > 0) {
            const socketId = this.connectedDevices.get(deviceId);
            if (socketId) {
                // Split changes into batches
                for (let i = 0; i < changes.length; i += this.BATCH_SIZE) {
                    const batch = changes.slice(i, i + this.BATCH_SIZE);

                    // Send batch and wait for acknowledgment or delay
                    this.server.to(socketId).emit('changes', {
                        changes: batch,
                        requiresAck: true,
                        batchInfo: {
                            current: Math.floor(i / this.BATCH_SIZE) + 1,
                            total: Math.ceil(changes.length / this.BATCH_SIZE)
                        }
                    });

                    // Add delay between batches
                    if (i + this.BATCH_SIZE < changes.length) {
                        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
                    }
                }

                this.logger.log(`Sent ${changes.length} changes in ${Math.ceil(changes.length / this.BATCH_SIZE)} batches to device ${deviceId}`);
            }
        }
    }

    notifyChanges(sourceDeviceId: string, changeLog: ChangeLog) {
        const sourceSocketId = this.connectedDevices.get(sourceDeviceId);

        // Notify all connected devices except the source
        const connectedDeviceIds = Array.from(this.connectedDevices.entries())
            .filter(([id, sid]) => id !== sourceDeviceId && sid !== sourceSocketId);

        this.logger.log(`Notifying ${connectedDeviceIds.length} devices of new change`);

        for (const [_, socketId] of connectedDeviceIds) {
            this.server.to(socketId).emit('changes', {
                changes: [changeLog],
                requiresAck: true
            });
        }
    }
}