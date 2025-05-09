import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SyncService } from './sync.service';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';
import { SyncNotificationDto } from './dto/sync-notification.dto';
import { DeviceChange } from '@prisma/client';
import { RedisService } from '../../common/services/redis.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'sync/notifications',
})
@UseGuards(SocketAuthGuard)
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(SyncGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        @Inject(forwardRef(() => SyncService))
        private readonly syncService: SyncService,
        private readonly redisService: RedisService,
    ) { }

    async handleConnection(client: Socket) {
        const deviceId = client.handshake.headers['x-device-id'] as string;
        const userId = client.handshake.headers['x-user-id'] as string;
        const projectId = client.handshake.headers['x-project-id'] as string;
        console.log('Client connected:', client.id, 'User:', userId, 'Device:', deviceId);
        
        if (!deviceId || !userId || !projectId) {
            this.logger.warn(`Client ${client.id} attempted connection without deviceId or userId or projectId`);
            client.disconnect();
            return;
        }
        
        this.logger.log(`Client connected: ${client.id} (User: ${userId}, Device: ${deviceId})`);
    }

    async handleDisconnect(client: Socket) {
        try {
            const clientInfo = await this.redisService.getClientInfo(client.id);
            if (clientInfo) {
                await this.redisService.removeOnlineDevice(clientInfo.userId, clientInfo.deviceId);
                await this.redisService.removeClientInfo(client.id);
                this.logger.log(`Client disconnected: ${client.id} (User: ${clientInfo.userId}, Device: ${clientInfo.deviceId})`);
            } else {
                this.logger.log(`Client disconnected: ${client.id} (No stored info)`);
            }
        } catch (error) {
            this.logger.error(`Error handling client disconnect: ${error.message}`);
        }
    }

    @SubscribeMessage('subscribe')
    async handleSubscribe(client: Socket, payload: { userId: string, deviceId: string, since: number, projectId: string }) {
        if (!payload.userId || !payload.deviceId) {
            this.logger.warn(`Client ${client.id} tried to subscribe without userId or deviceId`);
            return { success: false, error: 'userId and deviceId are required' };
        }

        try {
            await this.redisService.storeClientInfo(client.id, payload.userId, payload.deviceId);
            await this.redisService.addOnlineDevice(payload.userId, payload.deviceId, client.id);

            client.join(`user-${payload.userId}`);
            this.logger.log(`Client ${client.id} subscribed to updates for user ${payload.userId} with device ${payload.deviceId}`);

            this.syncService.verifyMissedChanges(payload.userId, payload.deviceId, payload.since, payload.projectId);

            return { success: true };
        } catch (error) {
            this.logger.error(`Error handling subscription: ${error.message}`);
            return { success: false, error: 'Internal server error' };
        }
    }

    /**
     * Notify all connected devices for a user about new changes, except the source device
     * @param userId The user identifier
     * @param payload The notification payload with change information
     */
    async notifyChanges(userId: string, payload: SyncNotificationDto) {
        const sourceDeviceId = payload.sourceDeviceId;

        if (!sourceDeviceId) {
            this.logger.warn(`Notification payload missing sourceDeviceId: ${JSON.stringify(payload)}`);
            return;
        }

        this.logger.debug(`Preparing to send notification to user ${userId} devices (except ${sourceDeviceId})`);

        try {
            const roomName = `user-${userId}`;
            const roomSockets = await this.server.in(roomName).fetchSockets();

            if (!roomSockets || roomSockets.length === 0) {
                this.logger.debug(`No connected clients for user ${userId}`);
                return;
            }

            let notifiedCount = 0;
            for (const socket of roomSockets) {
                const clientInfo = await this.redisService.getClientInfo(socket.id);

                if (clientInfo && clientInfo.deviceId === sourceDeviceId) {
                    this.logger.debug(`Skipping notification to source device ${sourceDeviceId} (socket: ${socket.id})`);
                    continue;
                }
                socket.emit('sync-changes', payload);
                this.logger.debug(`Sent notification to socket ${socket.id} (device: ${clientInfo?.deviceId || 'unknown'})`);
                notifiedCount++;
            }

            if (notifiedCount === 0) {
                this.logger.debug(`No other devices connected for user ${userId}`);
            } else {
                this.logger.debug(`Notified ${notifiedCount} sockets for user ${userId}`);
            }
        } catch (error) {
            this.logger.error(`Error notifying devices for user ${userId}: ${error.message}`);
        }
    }

    async notifyMissedChanges(userId: string, deviceId: string, changes: DeviceChange[]) {
        this.logger.debug(`Preparing to notify device ${deviceId} about ${changes.length} missed changes`);

        const roomName = `user-${userId}`;
        const roomSockets = await this.server.in(roomName).fetchSockets();
        for (const socket of roomSockets) {
            const clientInfo = await this.redisService.getClientInfo(socket.id);
            if (clientInfo && clientInfo.deviceId === deviceId) {
                socket.emit('sync-changes', {
                    type: 'missed_changes',
                    sourceDeviceId: deviceId,
                    changeCount: changes.length,
                    timestamp: Date.now()
                } as SyncNotificationDto);
            }
        }
    }
}
