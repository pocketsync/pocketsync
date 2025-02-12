import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeLog } from '@prisma/client';

@Injectable()
@WebSocketGateway({
    cors: true,
    namespace: 'changes'
})
export class ChangesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChangesGateway.name);

    @WebSocketServer()
    private server: Server;

    private connectedDevices: Map<string, string> = new Map(); // deviceId -> socketId

    constructor(
        private prisma: PrismaService,
    ) { }

    async handleConnection(client: any) {
        const { device_id, user_id, project_id } = client.handshake.query;
        const apiKey = client.handshake.headers['x-api-key'];

        if (!device_id || !user_id || !project_id || !apiKey) {
            this.logger.warn('Connection rejected: Missing required parameters');
            client.disconnect();
            return;
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: project_id,
                apiKey: apiKey,
            }
        });

        if (!project) {
            this.logger.warn(`Connection rejected: Invalid project credentials`);
            client.disconnect();
            return;
        }

        // Verify device exists and belongs to the project
        const device = await this.prisma.device.findFirst({
            where: {
                deviceId: device_id,
                userIdentifier: user_id,
                appUser: {
                    projectId: project_id
                }
            },
            include: {
                appUser: true
            }
        });

        if (!device) {
            this.logger.warn(`Connection rejected: Invalid device credentials for device ${device_id}`);
            client.disconnect();
            return;
        }

        this.connectedDevices.set(device_id, client.id);
        this.logger.log(`Device ${device_id} connected to project ${project_id}`);

        // Send any missed changes to the newly connected device
        await this.sendMissedChanges(device_id, user_id);
    }

    handleDisconnect(client: any) {
        const deviceId = Array.from(this.connectedDevices.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];

        if (deviceId) {
            this.connectedDevices.delete(deviceId);
            this.logger.log(`Device ${deviceId} disconnected`);
        }
    }

    private async sendMissedChanges(deviceId: string, userIdentifier: string) {
        const device = await this.prisma.device.findFirst({
            where: { deviceId, userIdentifier }
        });

        if (!device) return;

        const changes = await this.prisma.changeLog.findMany({
            where: {
                userIdentifier: device.userIdentifier,
                processedAt: device.lastSeenAt ? { gte: device.lastSeenAt } : undefined,
                deviceId: { not: device.deviceId },
            },
            orderBy: {
                id: 'asc'
            }
        });

        if (changes.length > 0) {
            const socketId = this.connectedDevices.get(deviceId);
            if (socketId) {
                this.server.to(socketId).emit('changes', changes);
            }
        }
    }

    notifyChanges(sourceDeviceId: string, changeLog: ChangeLog) {
        const sourceSocketId = this.connectedDevices.get(sourceDeviceId);

        // Notify all connected devices except the source
        const connectedDeviceIds = Array.from(this.connectedDevices.entries())
            .filter(([id, sid]) => id !== sourceDeviceId && sid !== sourceSocketId);

        for (const [_, socketId] of connectedDeviceIds) {
            this.server.to(socketId).emit('changes', [changeLog]);
        }
    }
}