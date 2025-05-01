import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import { UseGuards } from '@nestjs/common';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';

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

    constructor(private readonly syncService: SyncService) { }

    async handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(client: Socket, payload: { userId: string, deviceId: string }) {
        client.join(`user-${payload.userId}`);
        this.logger.log(`Client ${client.id} subscribed to updates for user ${payload.userId}`);
        return { success: true };
    }

    notifyChanges(userId: string, changes: any) {
        this.server.to(`user-${userId}`).emit('changes', changes);
    }
}
