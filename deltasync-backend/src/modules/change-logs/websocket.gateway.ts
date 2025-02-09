import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface ChangeNotification {
  type: string;
  data: any;
}

interface SocketAcknowledgement {
  status: string;
  message?: string;
}

@NestWebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'changes',
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(private prisma: PrismaService) {
    setInterval(() => this.cleanupStaleConnections(), 5 * 60 * 1000); // Every 5 minutes
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Gateway initialized');
    server.use((socket: Socket, next) => {
      const deviceId = socket.handshake.query.deviceId;
      if (!deviceId) {
        this.logger.warn('Connection rejected - missing deviceId');
        next(new Error('Device ID is required'));
        return;
      }
      next();
    });
  }

  async handleConnection(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      const userIdentifier = client.handshake.headers['x-app-user-id'] as string;


      if (!deviceId) {
        client.disconnect();
        return;
      }

      client.join(deviceId);
      this.logger.log(`Device ${deviceId} joined room ${deviceId}`);


      if (!deviceId || !userIdentifier) {
        throw new Error('Missing required connection parameters');
      }

      const appUser = await this.prisma.appUser.findFirst({ where: { userIdentifier } });
      if (!appUser) throw new Error(`App user not found for identifier: ${userIdentifier}`);

      await this.handleDuplicateConnection(deviceId);


      const device = await this.getOrCreateDevice(deviceId, appUser.id);
      await this.prisma.device.update({
        where: { id: device.id },
        data: { socketId: client.id, isConnected: true, lastSeenAt: new Date() },
      });

      this.logger.log(`Device ${deviceId} connected (Socket ID: ${client.id})`);
      client.emit('connected', { status: 'success', deviceId, timestamp: Date.now() });

      await this.deliverPendingChanges(deviceId);
    } catch (error) {
      this.logger.error('Connection error:', { error: error.message, stack: error.stack });
      client.emit('error', { status: 'error', message: 'Connection failed: ' + error.message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const deviceId = client.handshake.query.deviceId as string;
    try {
      if (deviceId) {
        const device = await this.prisma.device.findFirst({ where: { deviceId } });
        if (device) {
          await this.prisma.device.update({
            where: { id: device.id },
            data: { isConnected: false, socketId: null, lastSeenAt: new Date() },
          });
          this.logger.log(`Device ${deviceId} disconnected`);
        }
      }
    } catch (error) {
      this.logger.error('Disconnection error:', { error: error.message, stack: error.stack });
    }
  }

  private async cleanupStaleConnections() {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    const staleDevices = await this.prisma.device.findMany({
      where: { isConnected: true, lastSeenAt: { lt: staleThreshold } },
    });

    for (const device of staleDevices) {
      if (!device.socketId) continue;
      const socket = this.server.sockets.sockets.get(device.socketId);
      if (socket?.connected) socket.disconnect();

      await this.prisma.device.update({
        where: { id: device.id },
        data: { isConnected: false, socketId: null, lastSeenAt: new Date() },
      });
      this.logger.debug(`Cleaned up stale connection for device ${device.deviceId}`);
    }
  }

  async notifyDevice(deviceId: string, payload: ChangeNotification): Promise<boolean> {
    const adapter = this.server.sockets?.adapter;
    if (!adapter?.rooms) {
      this.logger.error('Socket adapter or rooms not available.');
      await this.storeNotificationForLaterDelivery(deviceId, payload);
      return false;
    }

    const socketsInRoom = adapter.rooms.get(deviceId);
    if (!socketsInRoom || socketsInRoom.size === 0) {
      this.logger.debug(`No active sockets for device ${deviceId}, storing for later delivery.`);
      await this.storeNotificationForLaterDelivery(deviceId, payload);
      return false;
    }

    this.logger.debug(`Sending notification to room ${deviceId}`);
    return this.attemptNotification(deviceId, payload);
  }


  private async attemptNotification(deviceId: string, payload: ChangeNotification): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 3;

      const tryEmit = () => {
        if (attempts >= maxAttempts) {
          this.logger.warn(`Failed to notify device ${deviceId} after ${maxAttempts} attempts.`);
          resolve(false);
          return;
        }

        this.server.to(deviceId).emit('change', payload, (ack: SocketAcknowledgement) => {
          if (ack?.status === 'success') {
            this.logger.debug(`Notification to device ${deviceId} acknowledged successfully.`);
            resolve(true);
          } else {
            attempts++;
            this.logger.debug(`Retrying notification to device ${deviceId} (attempt ${attempts + 1})...`);
            setTimeout(tryEmit, 1000);
          }
        });
      };

      tryEmit();
    });
  }


  private async deliverPendingChanges(deviceId: string) {
    const pendingChanges = await this.fetchPendingChangesForDevice(deviceId);
    for (const change of pendingChanges) {
      await this.notifyDevice(deviceId, change);
    }
  }

  private async fetchPendingChangesForDevice(deviceId: string): Promise<ChangeNotification[]> {
    const changes = await this.prisma.changeLog.findMany({
      where: { deviceId, processedAt: null },
      orderBy: { receivedAt: 'asc' },
    });

    return changes.map((change) => ({
      type: 'CHANGE_NOTIFICATION',
      data: change.changeSet,
    }));
  }

  private async storeNotificationForLaterDelivery(deviceId: string, payload: ChangeNotification) {
    const device = await this.prisma.device.findFirst({ where: { deviceId }, select: { id: true } });
    if (device) {
      await this.prisma.changeLog.create({
        data: { deviceId: device.id, changeSet: payload.data, receivedAt: new Date(), appUserId: payload.data.appUserId },
      });
    }
  }

  private async getOrCreateDevice(deviceId: string, appUserId: string) {
    const device = await this.prisma.device.findFirst({ where: { deviceId, appUserId } });
    if (device) return device;

    return this.prisma.device.create({
      data: { deviceId, appUserId, isConnected: false, lastSeenAt: new Date() },
    });
  }

  private async handleDuplicateConnection(deviceId: string) {
    const device = await this.prisma.device.findFirst({ where: { deviceId } });
    if (device?.isConnected && device.socketId) {
      const socket = this.server.sockets.sockets.get(device.socketId);
      if (socket?.connected) socket.disconnect();
      await this.prisma.device.update({
        where: { id: device.id },
        data: { isConnected: false, socketId: null, lastSeenAt: new Date() },
      });
    }
  }
}
