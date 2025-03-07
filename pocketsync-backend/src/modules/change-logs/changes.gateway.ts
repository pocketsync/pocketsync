import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeLog } from '@prisma/client';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesService } from '../devices/devices.service';
import { SocketAuthGuard } from '../../common/guards/socket-auth.guard';
import { MetadataSanitizerService } from './services/metadata-sanitizer.service';
import { ChangeFilterService } from './services/change-filter.service';

@Injectable()
@WebSocketGateway({
    cors: true,
    namespace: 'changes'
})
@UseGuards(SocketAuthGuard)
export class ChangesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChangesGateway.name);
    private readonly BATCH_SIZE = 50;
    private readonly BATCH_DELAY = 1000; // 1 second delay between batches

    @WebSocketServer()
    private server: Server;

    private connectedDevices: Map<string, string> = new Map(); // deviceId -> socketId

    constructor(
        private prisma: PrismaService,
        private readonly devicesService: DevicesService,
        private readonly appUsersService: AppUsersService,
        private readonly metadataSanitizer: MetadataSanitizerService,
        private readonly changeFilter: ChangeFilterService,
    ) { }

    async handleConnection(client: any) {
        const { device_id, user_id, project_id, last_synced_at } = client.handshake.query;

        if (!device_id || !user_id || !project_id) {
            this.logger.warn('Connection rejected: Missing required parameters');
            client.disconnect();
            return;
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: project_id,
                deletedAt: null
            }
        });

        if (!project) {
            this.logger.warn(`Connection rejected: Invalid project credentials`);
            client.disconnect();
            return;
        }

        await this.appUsersService.getOrCreateUserFromId(user_id, project_id);
        await this.devicesService.getOrCreateDeviceFromId(device_id, user_id, project_id);

        this.connectedDevices.set(device_id, client.id);

        // Convert milliseconds timestamp to Date object
        const lastSyncedDate = last_synced_at ? new Date(parseInt(last_synced_at)) : null;

        // Send any missed changes to the newly connected device
        await this.sendMissedChanges(device_id, user_id, lastSyncedDate);
    }

    handleDisconnect(client: any) {
        const deviceId = Array.from(this.connectedDevices.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];

        if (deviceId) {
            this.connectedDevices.delete(deviceId);
            this.logger.log(`Device ${deviceId} disconnected`);
        }
    }

    @SubscribeMessage('acknowledge-changes')
    async handleAcknowledgeChanges(client: any, payload: { changeIds: number[] }) {
        const deviceId = Array.from(this.connectedDevices.entries())
            .find(([_, socketId]) => socketId === client.id)?.[0];

        if (!deviceId) {
            this.logger.warn('Acknowledgment received from unknown device');
            return;
        }

        const device = await this.prisma.device.findFirst({
            where: { deviceId, deletedAt: null }
        });

        if (!device) {
            this.logger.warn(`Device ${deviceId} not found in database`);
            return;
        }

        const now = new Date();
        await this.prisma.device.update({
            where: {
                deviceId_userIdentifier: {
                    deviceId,
                    userIdentifier: device.userIdentifier
                }
            },
            data: {
                lastSeenAt: now,
            }
        });

        this.logger.log(`Device ${deviceId} acknowledged ${payload.changeIds.length} changes`);
    }

    private async sendMissedChanges(deviceId: string, userIdentifier: string, lastSyncedAt: Date | null) {
        const device = await this.prisma.device.findFirst({
            where: { deviceId, userIdentifier }
        });

        if (!device) return;

        // Determine the effective sync date - use the later of:
        // 1. The provided lastSyncedAt parameter (from client)
        // 2. The device's lastChangeAt field (tracks when changes were made to this device's data)
        // This ensures we don't miss any changes that happened after the last sync
        let effectiveSyncDate: Date | null = null;

        if (lastSyncedAt && device.lastChangeAt) {
            // If we have both dates, use the later one to ensure we don't miss any changes
            effectiveSyncDate = lastSyncedAt > device.lastChangeAt ? lastSyncedAt : device.lastChangeAt;
        } else {
            // Otherwise use whichever one is available
            effectiveSyncDate = lastSyncedAt || device.lastChangeAt;
        }

        this.logger.log(`Sending missed changes to device ${deviceId}, using effective sync date: ${effectiveSyncDate}`);

        // Get all changes
        const changes = await this.prisma.changeLog.findMany({
            where: {
                userIdentifier: device.userIdentifier,
                ...(effectiveSyncDate ? {
                    OR: [
                        // Get changes processed after effective sync date
                        { processedAt: { gte: effectiveSyncDate } },
                        // Get updates to existing records
                        { receivedAt: { gte: effectiveSyncDate } }
                    ],
                } : {}), // For new devices (null effectiveSyncDate), get all changes
                // Include changes from other devices AND from this device that were made to its data
                OR: [
                    { deviceId: { not: device.deviceId } }, // Changes from other devices
                    {
                        // Changes to this device's data (where this device was the original source)
                        AND: [
                            { deviceId: device.deviceId },
                            ...(effectiveSyncDate ? [{ processedAt: { gte: effectiveSyncDate } }] : [])
                        ]
                    }
                ]
            },
            orderBy: [
                { receivedAt: 'asc' },
                { id: 'asc' }
            ],
        });

        // For new or reinstalled devices, filter out records that were deleted
        let filteredChanges = changes;

        // If this is a new or reinstalled device (no sync history), filter out deleted records
        if (!lastSyncedAt && changes.length > 0) {
            this.logger.log(`New or reinstalled device detected. Filtering out deleted records...`);
            filteredChanges = this.changeFilter.filterDeletedRecords(changes);
        }

        if (filteredChanges && filteredChanges.length > 0) {
            const socketId = this.connectedDevices.get(deviceId);
            if (socketId) {
                // Split changes into batches
                for (let i = 0; i < filteredChanges.length; i += this.BATCH_SIZE) {
                    const batch = filteredChanges.slice(i, i + this.BATCH_SIZE);

                    // Ensure metadata is only at row level, never in row.data
                    const sanitizedBatch = batch.map(change => this.metadataSanitizer.ensureMetadataAtRowLevel(change));

                    // Send batch and wait for acknowledgment or delay
                    this.server.to(socketId).emit('changes', {
                        changes: sanitizedBatch,
                        requiresAck: true,
                        batchInfo: {
                            current: Math.floor(i / this.BATCH_SIZE) + 1,
                            total: Math.ceil(filteredChanges.length / this.BATCH_SIZE)
                        }
                    });

                    // Add delay between batches
                    if (i + this.BATCH_SIZE < filteredChanges.length) {
                        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
                    }
                }

                this.logger.log(`Sent ${filteredChanges.length} changes in ${Math.ceil(filteredChanges.length / this.BATCH_SIZE)} batches to device ${deviceId}`);
            }
        }
    }

    notifyChanges(sourceDeviceId: string, changeLog: ChangeLog) {
        // Store the change for all devices, including the source device
        // This ensures the change is available for the source device when it reconnects
        this.storeChangeForAllDevices(sourceDeviceId, changeLog);

        const sourceSocketId = this.connectedDevices.get(sourceDeviceId);

        // Notify all connected devices except the source (immediate notification)
        const connectedDeviceIds = Array.from(this.connectedDevices.entries())
            .filter(([id, sid]) => id !== sourceDeviceId && sid !== sourceSocketId);

        this.logger.log(`Notifying ${connectedDeviceIds.length} devices of new change`);

        for (const [_, socketId] of connectedDeviceIds) {
            // Ensure metadata is only at row level, never in row.data
            const sanitizedChangeLog = this.metadataSanitizer.ensureMetadataAtRowLevel(changeLog);

            this.server.to(socketId).emit('changes', {
                changes: [sanitizedChangeLog],
                requiresAck: true
            });
        }
    }

    /**
     * Stores a change in the database to ensure it's available for all devices,
     * including the source device when it reconnects.
     */
    private async storeChangeForAllDevices(sourceDeviceId: string, changeLog: ChangeLog) {
        try {
            // Get all devices for this user
            const devices = await this.prisma.device.findMany({
                where: {
                    userIdentifier: changeLog.userIdentifier,
                    deletedAt: null
                }
            });

            this.logger.log(`Storing change for future sync with ${devices.length} devices`);

            // Update the last change timestamp for each device
            // This ensures the change will be included in future sync operations
            const now = new Date();
            await this.prisma.$transaction(
                devices.map(device => this.prisma.device.update({
                    where: {
                        deviceId_userIdentifier: {
                            deviceId: device.deviceId,
                            userIdentifier: device.userIdentifier
                        }
                    },
                    data: {
                        lastChangeAt: now
                    }
                }))
            );
        } catch (error) {
            this.logger.error('Error storing change for devices', {
                error: error.message,
                sourceDeviceId,
                changeLogId: changeLog.id,
                stack: error.stack
            });
        }
    }
}