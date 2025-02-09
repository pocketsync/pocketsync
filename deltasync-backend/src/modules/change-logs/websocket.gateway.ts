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

interface DeviceConnection {
  socket: Socket;
  lastActivity: Date;
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

  private deviceConnections = new Map<string, DeviceConnection>();

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

      // Validate device and user
      const device = await this.getOrCreateDevice(deviceId, appUserId);
      
      // Handle duplicate connections
      await this.handleDuplicateConnection(deviceId);

      // Store connection with timestamp
      this.deviceConnections.set(deviceId, {
        socket: client,
        lastActivity: new Date()
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

  private async getOrCreateDevice(deviceId: string, appUserId: string) {
    return await this.prisma.device.upsert({
      where: { 
        appUserId_deviceId: {
          appUserId,
          deviceId
        }
      },
      update: { lastSeenAt: new Date() },
      create: {
        deviceId,
        appUserId,
        lastSeenAt: new Date()
      }
    });
  }

  private async handleDuplicateConnection(deviceId: string) {
    const existingConnection = this.deviceConnections.get(deviceId);
    if (existingConnection?.socket.connected) {
      this.logger.warn(`Duplicate connection attempt for device ${deviceId}`);
      existingConnection.socket.disconnect();
      this.deviceConnections.delete(deviceId);
    }
  }

  private async cleanupStaleConnections() {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    for (const [deviceId, connection] of this.deviceConnections.entries()) {
      if (connection.lastActivity < staleThreshold) {
        this.logger.debug(`Cleaning up stale connection for device ${deviceId}`);
        connection.socket.disconnect();
        this.deviceConnections.delete(deviceId);
      }
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const deviceId = client.handshake.query.deviceId as string;
      if (deviceId) {
        this.deviceConnections.delete(deviceId);
        this.logger.log(`Device ${deviceId} disconnected (Socket ID: ${client.id})`);
      }
    } catch (error) {
      this.logger.error('Disconnection error:', { error: error.message, socketId: client.id });
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
          appUserId: device.appUserId,
          deviceId: device.id, // Use the device's UUID here
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

  async notifyDevice(deviceId: string, payload: ChangeNotification): Promise<boolean> {
    try {
      const connection = this.deviceConnections.get(deviceId);
      if (!connection?.socket.connected) {
        await this.storeNotificationForLaterDelivery(deviceId, payload);
        return false;
      }

      let retryCount = 0;
      const acknowledged = await this.attemptNotification(connection.socket, payload, retryCount);
      
      if (!acknowledged) {
        await this.storeNotificationForLaterDelivery(deviceId, payload);
      } else {
        // Update last activity timestamp
        connection.lastActivity = new Date();
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

  private attemptNotification(
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

      client.emit('change', payload, (ack: SocketAcknowledgement) => {
        clearTimeout(timeoutId);
        resolve(ack?.status === 'success');
      });
    });
  }

  private async storeNotificationForLaterDelivery(
    deviceId: string, 
    payload: ChangeNotification
  ): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { deviceId },
      select: { id: true, appUserId: true }
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    await this.prisma.changeLog.create({
      data: {
        deviceId: device.id, // Use the device's UUID here
        changeSet: JSON.stringify(payload.data),
        receivedAt: new Date(),
        appUserId: device.appUserId,
      },
    });
    
    this.logger.debug(`Stored notification for later delivery to device ${deviceId}`);
  }
}