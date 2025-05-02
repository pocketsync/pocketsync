import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SyncService } from './sync.service';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';
import { SyncNotificationDto } from './dto/sync-notification.dto';
import { PrismaService } from '../../modules/prisma/prisma.service';

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
            const roomSockets = this.server.in(roomName).fetchSockets();

            if (!roomSockets || (await roomSockets).length === 0) {
                this.logger.debug(`No connected clients for user ${userId}`);
                return;
            }

            // Send to all clients in the room except the source device
            for (const socket of await roomSockets) {
                const clientInfo = this.clientDeviceMap.get(socket.id);

                // Skip if this client is from the source device
                if (clientInfo && clientInfo.deviceId === sourceDeviceId) {
                    this.logger.debug(`Skipping notification to source device ${sourceDeviceId} (socket: ${socket.id})`);
                    continue;
                }

                // Send the notification to this client
                socket.emit('sync-changes', payload);
                this.logger.debug(`Sent notification to socket ${socket.id}`);
            }
        } catch (error) {
            this.logger.error(`Error notifying devices for user ${userId}: ${error.message}`);
        }
    }
}
