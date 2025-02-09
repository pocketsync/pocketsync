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
    this.logger.debug('WebSocket server configuration:', {
      namespace: 'changes',
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    server.use((socket: Socket, next) => {
      const deviceId = socket.handshake.query.deviceId;
      this.logger.debug('Connection attempt from device:', { deviceId, socketId: socket.id });
      
      if (!deviceId) {
        this.logger.warn('Connection rejected - missing deviceId', { socketId: socket.id });
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
        this.logger.log(`Device ${deviceId} connected (Socket ID: ${client.id})`);
        this.logger.debug('Current active connections:', { count: this.deviceConnections.size });
        client.emit('connected', { status: 'success', deviceId });
      }
    } catch (error) {
      this.logger.error('Connection error:', { error: error.message, socketId: client.id });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        this.deviceConnections.delete(deviceId);
        this.logger.log(`Device ${deviceId} disconnected (Socket ID: ${client.id})`);
        this.logger.debug('Remaining active connections:', { count: this.deviceConnections.size });
      }
    } catch (error) {
      this.logger.error('Disconnection error:', { error: error.message, socketId: client.id });
    }
  }

  notifyDevice(deviceId: string, payload: any) {
    try {
      const client = this.deviceConnections.get(deviceId);
      if (client?.connected) {
        client.emit('change', payload);
        this.logger.log(`Notified device ${deviceId} of changes`);
        this.logger.debug('Notification payload:', { deviceId, type: payload.type });
      } else {
        this.logger.warn(`Unable to notify device ${deviceId} - not connected`);
      }
    } catch (error) {
      this.logger.error(`Error notifying device ${deviceId}:`, { error: error.message });
    }
  }
}