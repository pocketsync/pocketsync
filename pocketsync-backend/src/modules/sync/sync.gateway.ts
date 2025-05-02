import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SyncService } from './sync.service';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';
import { SyncNotificationDto } from './dto/sync-notification.dto';
import { DeviceChange } from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'sync/notifications',
})
@UseGuards(SocketAuthGuard)
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(SyncGateway.name);

    // Map to store client-to-device mapping
    private clientDeviceMap = new Map<string, { userId: string, deviceId: string }>();

    @WebSocketServer()
    server: Server;

    constructor(
        @Inject(forwardRef(() => SyncService))
        private readonly syncService: SyncService,
    ) { }

    async handleConnection(client: Socket) {
        // Verify connection has required authentication headers
        const token = client.handshake.headers.authorization;
        if (!token) {
            this.logger.warn(`Client ${client.id} attempted connection without authorization header`);
            client.disconnect();
            return;
        }

        const projectId = client.handshake.headers['x-project-id'];
        if (!projectId) {
            this.logger.warn(`Client ${client.id} attempted connection without projectId`);
            client.disconnect();
            return;
        }

        // Check if client has device information
        if (!client.handshake.headers['x-device-id'] || !client.handshake.headers['x-user-id']) {
            this.logger.warn(`Client ${client.id} attempted connection without deviceId or userId`);
            client.disconnect();
            return;
        }

        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        // Clean up the client-to-device mapping when a client disconnects
        this.clientDeviceMap.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(client: Socket, payload: { userId: string, deviceId: string, since: number }) {
        if (!payload.userId || !payload.deviceId) {
            this.logger.warn(`Client ${client.id} tried to subscribe without userId or deviceId`);
            return { success: false, error: 'userId and deviceId are required' };
        }

        // Store the client-to-device mapping
        this.clientDeviceMap.set(client.id, {
            userId: payload.userId,
            deviceId: payload.deviceId
        });

        // Join the user's room
        client.join(`user-${payload.userId}`);
        this.logger.log(`Client ${client.id} subscribed to updates for user ${payload.userId} with device ${payload.deviceId}`);

        // This should be an acknoledgement of the subscription
        this.syncService.verifyMissedChanges(payload.userId, payload.deviceId, payload.since);

        return { success: true };
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
            // Get all socket IDs in the user's room
            const roomName = `user-${userId}`;
            const roomSockets = await this.server.in(roomName).fetchSockets();

            if (!roomSockets || roomSockets.length === 0) {
                this.logger.debug(`No connected clients for user ${userId}`);
                return;
            }

            // Send to all clients in the room except the source device
            let notifiedCount = 0;
            for (const socket of roomSockets) {
                const clientInfo = this.clientDeviceMap.get(socket.id);

                // Skip if this client is from the source device
                if (clientInfo && clientInfo.deviceId === sourceDeviceId) {
                    this.logger.debug(`Skipping notification to source device ${sourceDeviceId} (socket: ${socket.id})`);
                    continue;
                }

                // Send the notification to this client
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

        // 1. We want to send notifications only to the socket with deviceId
        const roomName = `user-${userId}`;
        const roomSockets = await this.server.in(roomName).fetchSockets();
        for (const socket of roomSockets) {
            const clientInfo = this.clientDeviceMap.get(socket.id);
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

    /**
     * Map database change type to client-side operation type
     */
    private mapChangeTypeToOperation(changeType: string): string {
        switch (changeType) {
            case 'CREATE': return 'insert';
            case 'UPDATE': return 'update';
            case 'DELETE': return 'delete';
            default: return 'update';
        }
    }
}
