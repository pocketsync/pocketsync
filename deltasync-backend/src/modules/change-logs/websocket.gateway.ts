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
  type: 'CHANGE_NOTIFICATION';
  data: {
    version: number;
    timestamp: number;
    [key: string]: any;
  };
}

interface SocketAcknowledgement {
  status: 'success' | 'error';
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
  path: '/socket.io',
  allowEIO3: true,
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly NOTIFICATION_TIMEOUT = 5000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {
    // Start periodic cleanup of stale connections
    setInterval(() => this.cleanupStaleConnections(), 5 * 60 * 1000); // Every 5 minutes
  }

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
      const appUserId = client.handshake.headers['x-app-user-id'] as string;

      if (!deviceId || !appUserId) {
        throw new Error('Missing required connection parameters');
      }

      // Validate that appUserId is a valid UUID
      if (!this.isValidUUID(appUserId)) {
        throw new Error('Invalid app user ID format');
      }

      // Update device connection status
      const device = await this.prisma.device.update({
        where: {
          appUserId_deviceId: {
            appUserId,
            deviceId
          }
        },
        data: {
          socketId: client.id,
          isConnected: true,
          lastSeenAt: new Date()
        }
      });

      this.logger.log(`Device ${deviceId} connected (Socket ID: ${client.id})`);

      // Send connection acknowledgment
      client.emit('connected', {
        status: 'success',
        deviceId,
        timestamp: Date.now()
      });

      // Deliver pending changes
      await this.deliverPendingChanges(deviceId);
    } catch (error) {
      this.logger.error('Connection error:', {
        error: error.message,
        socketId: client.id,
        stack: error.stack
      });
      client.emit('error', {
        status: 'error',
        message: 'Connection failed: ' + error.message
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        await this.prisma.device.updateMany({
          where: {
            deviceId,
            socketId: client.id
          },
          data: {
            isConnected: false,
            socketId: null
          }
        });
        this.logger.log(`Device ${deviceId} disconnected (Socket ID: ${client.id})`);
      }
    } catch (error) {
      this.logger.error('Disconnection error:', { error: error.message, socketId: client.id });
    }
  }

  private async cleanupStaleConnections() {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    await this.prisma.device.updateMany({
      where: {
        isConnected: true,
        lastSeenAt: {
          lt: staleThreshold
        }
      },
      data: {
        isConnected: false,
        socketId: null
      }
    });
  }

  async notifyDevice(deviceId: string, payload: ChangeNotification): Promise<boolean> {
    try {
      // Get device connection info from database
      const device = await this.prisma.device.findFirst({
        where: { deviceId }
      });

      if (!device?.isConnected || !device.socketId) {
        this.logger.debug(`Device ${deviceId} not connected, storing for later delivery`);
        await this.storeNotificationForLaterDelivery(deviceId, payload);
        return false;
      }

      const socket = this.server.sockets.sockets.get(device.socketId);
      if (!socket?.connected) {
        // Update device status if socket is actually disconnected
        await this.prisma.device.update({
          where: { id: device.id },
          data: {
            isConnected: false,
            socketId: null
          }
        });
        await this.storeNotificationForLaterDelivery(deviceId, payload);
        return false;
      }

      let retryCount = 0;
      const acknowledged = await this.attemptNotification(socket, payload, retryCount);

      if (!acknowledged) {
        this.logger.debug(`Device ${deviceId} failed to acknowledge notification, storing for later delivery`);
        await this.storeNotificationForLaterDelivery(deviceId, payload);
      } else {
        // Update last activity timestamp
        await this.prisma.device.update({
          where: { id: device.id },
          data: { lastSeenAt: new Date() }
        });
        this.logger.debug(`Device ${deviceId} acknowledged notification successfully`);
      }

      return acknowledged;
    } catch (error) {
      this.logger.error(`Error notifying device ${deviceId}:`, {
        error: error.message,
        stack: error.stack,
        payload: JSON.stringify(payload)
      });
      return false;
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

  private async fetchPendingChangesForDevice(deviceId: string): Promise<ChangeNotification[]> {
    try {
      const device = await this.prisma.device.findFirst({
        where: { deviceId },
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
          appUserId: device.appUser.id,
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

  private async storeNotificationForLaterDelivery(
    deviceId: string,
    payload: ChangeNotification
  ): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { deviceId },
      select: {
        id: true,
        appUser: {
          select: {
            id: true
          }
        }
      }
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    await this.prisma.changeLog.create({
      data: {
        deviceId: device.id,
        changeSet: JSON.stringify(payload.data),
        receivedAt: new Date(),
        appUserId: device.appUser.id,
      },
    });

    this.logger.debug(`Stored notification for later delivery to device ${deviceId}`);
  }

  private async attemptNotification(
    client: Socket,
    payload: ChangeNotification,
    retryCount: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        if (retryCount < this.MAX_RETRIES) {
          this.logger.warn(`Retry attempt ${retryCount + 1} for device ${client.id}`);
          setTimeout(() => {
            this.attemptNotification(client, payload, retryCount + 1)
              .then(resolve)
              .catch(() => resolve(false));
          }, this.RETRY_DELAY);
        } else {
          this.logger.warn(`Max retries reached for device ${client.id}`);
          resolve(false);
        }
      }, this.NOTIFICATION_TIMEOUT);

      this.logger.debug(`Emitting change event to device ${client.id}`, {
        payload: JSON.stringify(payload)
      });

      client.emit('change', payload, (ack: SocketAcknowledgement) => {
        clearTimeout(timeoutId);
        if (ack?.status === 'success') {
          this.logger.debug(`Device ${client.id} acknowledged change notification`);
          resolve(true);
        } else {
          this.logger.warn(`Device ${client.id} failed to acknowledge change`, { ack });
          resolve(false);
        }
      });
    });
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async getOrCreateDevice(deviceId: string, appUserId: string) {
    // First try to find the existing device
    const existingDevice = await this.prisma.device.findFirst({
      where: {
        deviceId,
        appUser: {
          id: appUserId
        }
      }
    });

    if (existingDevice) {
      // Update last seen timestamp
      return await this.prisma.device.update({
        where: { id: existingDevice.id },
        data: { lastSeenAt: new Date() }
      });
    }

    // Create new device if not found
    return await this.prisma.device.create({
      data: {
        deviceId,
        appUser: {
          connect: {
            id: appUserId
          }
        },
        lastSeenAt: new Date()
      }
    });
  }

  private async handleDuplicateConnection(deviceId: string) {
    const existingConnection = await this.prisma.device.findFirst({
      where: { deviceId }
    });

    if (existingConnection?.isConnected) {
      this.logger.warn(`Duplicate connection attempt for device ${deviceId}`);
      if (existingConnection.socketId) {
        const socket = this.server.sockets.sockets.get(existingConnection.socketId);
        if (socket?.connected) {
          socket.disconnect();
        }
      }
      await this.prisma.device.update({
        where: { id: existingConnection.id },
        data: {
          isConnected: false,
          socketId: null
        }
      });
    }
  }
}