import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@NestWebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'changes',
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  allowEIO3: true,
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  private deviceConnections = new Map<string, Socket>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    server.use((socket: Socket, next) => {
      const deviceId = socket.handshake.query.deviceId;
      if (!deviceId) {
        next(new Error('Device ID is required'));
        return;
      }
      next();
    });
  }

  handleConnection(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        this.deviceConnections.set(deviceId, client);
        this.logger.log(`Device ${deviceId} connected`);
        client.emit('connected', { status: 'success', deviceId });
      }
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        this.deviceConnections.delete(deviceId);
        this.logger.log(`Device ${deviceId} disconnected`);
      }
    } catch (error) {
      this.logger.error('Disconnection error:', error);
    }
  }

  notifyDevice(deviceId: string, payload: any) {
    try {
      const client = this.deviceConnections.get(deviceId);
      if (client?.connected) {
        client.emit('change', payload);
        this.logger.log(`Notified device ${deviceId} of changes`);
      }
    } catch (error) {
      this.logger.error(`Error notifying device ${deviceId}:`, error);
    }
  }
}