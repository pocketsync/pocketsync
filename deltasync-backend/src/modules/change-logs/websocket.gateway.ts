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

  constructor(private prisma: PrismaService) { }

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

  async handleConnection(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        // Check if device exists in database
        let device = await this.prisma.device.findFirst({
          where: { deviceId }
        });

        if (!device) {
          const appUserId = client.handshake.headers['x-app-user-id'] as string;
          device = await this.prisma.device.create({
            data: {
              deviceId,
              appUserId: appUserId
            },
          });
          this.logger.log(`Created temporary device entry for ${deviceId}`);
        }

        // Handle potential duplicate connections
        const existingConnection = this.deviceConnections.get(deviceId);
        if (existingConnection?.connected) {
          this.logger.warn(`Duplicate connection attempt for device ${deviceId}`);
          existingConnection.disconnect();
        }

        this.deviceConnections.set(deviceId, client);
        this.logger.log(`Device ${deviceId} connected (Socket ID: ${client.id})`);
        this.logger.debug('Current active connections:', { count: this.deviceConnections.size });

        // Send connection success acknowledgment
        client.emit('connected', { status: 'success', deviceId });

        // Deliver any pending changes
        await this.deliverPendingChanges(deviceId);
      }
    } catch (error) {
      this.logger.error('Connection error:', { error: error.message, socketId: client.id });
      client.emit('error', { message: 'Internal server error' });
      client.disconnect();
    }
  }


  private async deliverPendingChanges(deviceId: string) {
    try {
      const pendingChanges = await this.fetchPendingChangesForDevice(deviceId);
      if (pendingChanges.length > 0) {
        this.logger.log(`Delivering ${pendingChanges.length} pending changes to device ${deviceId}`);
        pendingChanges.forEach((change) => {
          this.notifyDevice(deviceId, change);
        });
      } else {
        this.logger.log(`No pending changes for device ${deviceId}`);
      }
    } catch (error) {
      this.logger.error('Error delivering pending changes:', { error: error.message });
    }
  }

  private async fetchPendingChangesForDevice(deviceId: string): Promise<any[]> {
    try {
      const device = await this.prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          appUser: true
        }
      });

      if (!device) {
        this.logger.warn(`Device not found: ${deviceId}`);
        return [];
      }

      const pendingChanges = await this.prisma.changeLog.findMany({
        where: {
          appUserId: device.appUserId,
          deviceId: device.id,
          processedAt: null,
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          receivedAt: 'asc'
        }
      });

      return pendingChanges.map(change => ({
        type: 'CHANGE_NOTIFICATION',
        data: JSON.parse(change.changeSet as string)
      }));
    } catch (error) {
      this.logger.error('Error fetching pending changes:', { error: error.message, deviceId });
      return [];
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

  async notifyDevice(deviceId: string, payload: any) {
    try {
      const client = this.deviceConnections.get(deviceId);
      if (client?.connected) {
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        const attemptNotification = async (): Promise<boolean> => {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              if (retryCount < maxRetries) {
                retryCount++;
                this.logger.warn(`Retry attempt ${retryCount} for device ${deviceId}`);
                setTimeout(() => attemptNotification().then(resolve).catch(reject), retryDelay);
              } else {
                this.logger.warn(`Max retries reached for device ${deviceId}, storing for later delivery`);
                resolve(false);
              }
            }, 5000);

            client.emit('change', payload, (ack: any) => {
              clearTimeout(timeoutId);
              if (ack?.status === 'success') {
                this.logger.log(`Device ${deviceId} acknowledged change notification`);
                resolve(true);
              } else {
                this.logger.warn(`Device ${deviceId} failed to acknowledge change`);
                resolve(false);
              }
            });
          });
        };

        const acknowledged = await attemptNotification();
        if (!acknowledged) {
          // Store for later delivery if all retries failed
          const device = await this.prisma.device.findFirst({
            where: { deviceId: deviceId },
            select: { appUserId: true }
          });

          if (!device) {
            throw new Error(`Device ${deviceId} not found`);
          }

          await this.prisma.changeLog.create({
            data: {
              deviceId,
              changeSet: JSON.stringify(payload.data),
              receivedAt: new Date(),
              appUserId: device.appUserId,
            },
          });
        }
        return acknowledged;
      } else {
        this.logger.warn(`Device ${deviceId} not connected - storing notification for later delivery`);
        const device = await this.prisma.device.findFirst({
          where: { deviceId: deviceId },
          select: { appUserId: true }
        });

        if (!device) {
          throw new Error(`Device ${deviceId} not found`);
        }

        await this.prisma.changeLog.create({
          data: {
            deviceId,
            changeSet: JSON.stringify(payload.data),
            receivedAt: new Date(),
            appUserId: device.appUserId,
          },
        });
        return false;
      }
    } catch (error) {
      this.logger.error(`Error notifying device ${deviceId}:`, {
        error: error.message,
        stack: error.stack,
        payload: JSON.stringify(payload)
      });
      return false;
    }
  }
}