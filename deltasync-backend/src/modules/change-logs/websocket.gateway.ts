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

  constructor(private prisma: PrismaService) {}

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
        const device = await this.prisma.device.findFirst({
          where: { deviceId }
        })

        if (!device) {
          this.logger.warn(`Unknown device attempting to connect: ${deviceId}`);
          client.emit('error', { message: 'Device not registered' });
          client.disconnect();
          return;
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
        return new Promise((resolve, reject) => {
          client.emit('change', payload, (ack: any) => {
            if (ack?.status === 'success') {
              this.logger.log(`Device ${deviceId} acknowledged change notification`);
              resolve(true);
            } else {
              this.logger.warn(`Device ${deviceId} failed to acknowledge change`);
              reject(new Error('Change notification not acknowledged'));
            }
          });
  
          // Set a timeout for acknowledgment
          setTimeout(() => {
            reject(new Error('Change notification timeout'));
          }, 5000);
        });
      } else {
        this.logger.warn(`Device ${deviceId} not connected - storing notification for later delivery`);
        // Get the device to find its associated appUserId
        const device = await this.prisma.device.findUnique({
          where: { id: deviceId },
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
    } catch (error) {
      this.logger.error(`Error notifying device ${deviceId}:`, {
        error: error.message,
        stack: error.stack,
        payload: JSON.stringify(payload)
      });
      throw error;
    }
  }
}