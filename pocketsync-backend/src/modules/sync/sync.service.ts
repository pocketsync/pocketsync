import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { SyncChangeBatchDto, SyncChange, ChangeType, ChangeDataKey } from './dto/sync-change-batch.dto';
import { AppUser } from 'src/common/entities/app-user.entity';
import { Device } from 'src/common/entities/device.entity';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { ChangeOptimizerService } from './services/change-optimizer.service';
import { SyncGateway } from './sync.gateway';
import { SyncNotificationDto } from './dto/sync-notification.dto';
import { ChangeResponseDto } from './dto/change-response.dto';
import { DeviceChange, LogLevel, SyncStatus } from '@prisma/client';
import { SyncSessionsService } from '../sync-sessions/sync-sessions.service';
import { SyncLogsService } from '../sync-logs/sync-logs.service';
import { SyncMetricsService } from '../sync-metrics/sync-metrics.service';
import { DebugSettingsService } from '../debug-settings/debug-settings.service';
import { DevicesService } from '../devices/devices.service';
import { TrackedSyncMetric } from './dto/tracked-sync-metric.enum';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private prisma: PrismaService,
        private changeOptimizer: ChangeOptimizerService,
        @Inject(forwardRef(() => SyncGateway))
        private syncGateway: SyncGateway,
        private syncSessionsService: SyncSessionsService,
        private syncLogsService: SyncLogsService,
        private syncMetricsService: SyncMetricsService,
        private debugSettingsService: DebugSettingsService,
        private devicesService: DevicesService
    ) { }

    /**
     * Process and store incoming changes from a client
     */
    async uploadChanges(projectId: string, appUser: AppUser, device: Device, changeBatch: SyncChangeBatchDto) {
        if (!changeBatch.changes || changeBatch.changes.length === 0) {
            this.syncLogsService.createLog(
                projectId,
                'Upload changes failed: No changes provided',
                LogLevel.ERROR,
                { deviceId: device.deviceId },
                appUser.userIdentifier,
                device.deviceId
            );
            throw new BadRequestException('No changes provided');
        }

        if (changeBatch.change_count !== changeBatch.changes.length) {
            this.syncLogsService.createLog(
                projectId,
                'Upload changes failed: Change count mismatch',
                LogLevel.ERROR,
                { expected: changeBatch.change_count, actual: changeBatch.changes.length },
                appUser.userIdentifier,
                device.deviceId
            );
            throw new BadRequestException('Change count does not match the number of changes');
        }

        // Create a new sync session using the dedicated service
        const syncSession = await this.syncSessionsService.createSession(
            device.deviceId,
            appUser.userIdentifier
        );

        // Update device last seen timestamp
        await this.devicesService.updateLastSeen(device.deviceId, appUser.userIdentifier);

        // Log the start of the sync session
        await this.syncLogsService.createLog(
            projectId,
            'Sync session started',
            LogLevel.INFO,
            { changeCount: changeBatch.changes.length },
            appUser.userIdentifier,
            device.deviceId,
            syncSession.id
        );

        try {
            const now = Date.now();
            // Execute all database operations in a transaction
            const createdChanges = await this.prisma.$transaction(async (tx) => {
                const changes = await Promise.all(changeBatch.changes.map(async (change) => {
                    // Validate that data is not empty
                    if (!change.data || (typeof change.data === 'object' && Object.keys(change.data).length === 0)) {
                        this.logger.warn(`Received change with empty data: ${JSON.stringify(change)}`);
                    }

                    // Ensure data is properly formatted
                    let processedData: Record<string, any>;
                    if (change.data instanceof Map) {
                        processedData = Object.fromEntries(change.data);
                    } else if (typeof change.data === 'object') {
                        processedData = change.data;
                    } else {
                        this.logger.warn(`Invalid data format for change: ${JSON.stringify(change)}`);
                        processedData = {};
                    }

                    return tx.deviceChange.create({
                        data: {
                            projectId,
                            deviceId: device.deviceId,
                            changeId: change.change_id,
                            userIdentifier: appUser.userIdentifier,
                            changeType: this.mapChangeType(change.operation),
                            tableName: change.table_name,
                            recordId: change.record_id,
                            data: processedData,
                            clientTimestamp: new Date(change.timestamp),
                            clientVersion: change.version,
                            createdAt: new Date(now)
                        }
                    });
                }));

                return changes;
            });

            // Add log
            await this.syncLogsService.createLog(
                projectId,
                `${createdChanges.length} changes processed`,
                LogLevel.INFO,
                { tables: createdChanges.map(c => c.tableName).join(', ') },
                appUser.userIdentifier,
                device.deviceId,
                syncSession.id
            );

            // Calculate sync duration in milliseconds
            const syncDuration = Date.now() - now;

            // Complete the sync session with success status
            await this.syncSessionsService.completeSession(
                syncSession.id,
                'SUCCESS' as SyncStatus,
                createdChanges.length
            );

            // Update device last change timestamp and sync status
            await this.devicesService.updateSyncStatus(device.deviceId, appUser.userIdentifier, 'SUCCESS');

            // Update device last change timestamp
            await this.prisma.device.update({
                where: {
                    deviceId_userIdentifier: {
                        deviceId: device.deviceId,
                        userIdentifier: appUser.userIdentifier
                    }
                },
                data: {
                    lastChangeAt: new Date(now)
                }
            });

            // Log the successful completion of the sync session
            await this.syncLogsService.createLog(
                projectId,
                'Sync session completed successfully',
                LogLevel.INFO,
                { changeCount: createdChanges.length, duration: syncDuration },
                appUser.userIdentifier,
                device.deviceId,
                syncSession.id
            );

            // Check if detailed logging is enabled
            const detailedLoggingEnabled = await this.debugSettingsService.isDetailedLoggingEnabled(projectId);
            if (detailedLoggingEnabled) {
                // Add more detailed logs
                await this.syncLogsService.createLog(
                    projectId,
                    'Sync session details',
                    LogLevel.DEBUG,
                    {
                        changeCount: createdChanges.length,
                        duration: syncDuration,
                        changes: createdChanges.map(c => ({
                            id: c.id,
                            tableName: c.tableName,
                            recordId: c.recordId,
                            changeType: c.changeType
                        }))
                    },
                    appUser.userIdentifier,
                    device.deviceId,
                    syncSession.id
                );
            }


            // Record metrics
            await this.syncMetricsService.recordMetric(
                projectId,
                TrackedSyncMetric.SYNC_DURATION,
                syncDuration,
                { changeCount: createdChanges.length, sessionId: syncSession.id },
                appUser.userIdentifier,
                device.deviceId
            );

            await this.syncMetricsService.recordMetric(
                projectId,
                TrackedSyncMetric.CHANGES_UPLOADED,
                createdChanges.length,
                { sessionId: syncSession.id },
                appUser.userIdentifier,
                device.deviceId
            );

            await this.syncMetricsService.recordMetric(
                projectId,
                TrackedSyncMetric.BATCH_SIZE_IN_BYTES,
                changeBatch.changes.reduce((acc, change) => acc + JSON.stringify(change).length, 0),
                { sessionId: syncSession.id },
                appUser.userIdentifier,
                device.deviceId
            )

            // Notify other devices about the new changes
            this.notifyOtherDevices(appUser.userIdentifier, device.deviceId, createdChanges.length, projectId);

            return {
                success: true,
                timestamp: now,
                processed: createdChanges.length
            };

        } catch (e) {
            // Complete the sync session with failure status
            await this.syncSessionsService.completeSession(
                syncSession.id,
                'FAILED' as SyncStatus,
                0
            );

            // Update device sync status to failed
            await this.devicesService.updateSyncStatus(device.deviceId, appUser.userIdentifier, 'FAILED');

            // Log the failure of the sync session
            await this.syncLogsService.createLog(
                projectId,
                `Sync session failed: ${e.message}`,
                LogLevel.ERROR,
                { error: e.message, stack: e.stack },
                appUser.userIdentifier,
                device.deviceId,
                syncSession.id
            )

            return {
                success: false,
                timestamp: new Date(),
                processed: 0
            }
        }
    }

    /**
     * Retrieve changes for a client since a specific timestamp
     * Applies optimization to reduce the number of changes sent
     */
    async downloadChanges(projectId: string, appUser: AppUser, device: Device, since: number) {
        // Create a new sync session for download
        const syncSession = await this.syncSessionsService.createSession(
            device.deviceId,
            appUser.userIdentifier,
        );

        try {
            await this.devicesService.updateLastSeen(device.deviceId, appUser.userIdentifier);
            if (isNaN(since)) {
                await this.syncLogsService.createLog(
                    projectId,
                    'Download changes failed: Invalid since parameter',
                    LogLevel.ERROR,
                    { since },
                    appUser.userIdentifier,
                    device.deviceId,
                    syncSession.id
                );
                throw new BadRequestException('Invalid since parameter');
            }

            const sinceDate = new Date(since || 0);
            const changes = await this.prisma.deviceChange.findMany({
                where: {
                    projectId,
                    deviceId: { not: device.deviceId },
                    createdAt: { gt: sinceDate },
                    deletedAt: null
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            const syncChanges = changes.map(change => this.mapToSyncChange(change));
            const optimizedChanges = this.changeOptimizer.optimizeChanges(syncChanges);

            const timestamp = Date.now();
            const downloadTime = timestamp - since;

            // Update sync session with success status
            await this.syncSessionsService.completeSession(
                syncSession.id,
                SyncStatus.SUCCESS,
                optimizedChanges.length
            );

            await this.syncLogsService.createLog(
                projectId,
                'Changes downloaded successfully',
                LogLevel.INFO,
                {
                    changeCount: optimizedChanges.length,
                    since: new Date(since).toISOString(),
                    originalCount: changes.length,
                    downloadTime,
                    sessionId: syncSession.id
                },
                appUser.userIdentifier,
                device.deviceId,
                syncSession.id
            );


            // Record metrics
            await this.syncMetricsService.recordMetric(
                projectId,
                TrackedSyncMetric.CHANGES_DOWNLOADED,
                optimizedChanges.length,
                { originalCount: changes.length, since: new Date(since).toISOString(), sessionId: syncSession.id },
                appUser.userIdentifier,
                device.deviceId
            );

            await this.syncMetricsService.recordMetric(
                projectId,
                TrackedSyncMetric.DOWNLOAD_TIME,
                downloadTime,
                { changeCount: optimizedChanges.length, sessionId: syncSession.id },
                appUser.userIdentifier,
                device.deviceId
            );

            // Calculate optimization efficiency
            if (changes.length > 0) {
                const optimizationEfficiency = (changes.length - optimizedChanges.length) / changes.length * 100;
                await this.syncMetricsService.recordMetric(
                    projectId,
                    TrackedSyncMetric.OPTIMIZATION_EFFICIENCY,
                    optimizationEfficiency,
                    {
                        originalCount: changes.length,
                        optimizedCount: optimizedChanges.length,
                        sessionId: syncSession.id
                    },
                    appUser.userIdentifier,
                    device.deviceId
                );
            }

            // Check if detailed logging is enabled
            const detailedLoggingEnabled = await this.debugSettingsService.isDetailedLoggingEnabled(projectId);
            if (detailedLoggingEnabled && optimizedChanges.length > 0) {
                // Add more detailed logs
                await this.syncLogsService.createLog(
                    projectId,
                    'Download changes details',
                    LogLevel.DEBUG,
                    {
                        originalCount: changes.length,
                        optimizedCount: optimizedChanges.length,
                        changes: optimizedChanges.map(c => ({
                            change_id: c.change_id,
                            table_name: c.table_name,
                            record_id: c.record_id,
                            operation: c.operation
                        })),
                        sessionId: syncSession.id
                    },
                    appUser.userIdentifier,
                    device.deviceId,
                    syncSession.id
                );
            }

            return {
                changes: optimizedChanges,
                timestamp,
                count: optimizedChanges.length,
                sync_session_id: syncSession.id
            } as ChangeResponseDto;
        } catch (error) {
            await this.syncSessionsService.completeSession(
                syncSession.id,
                SyncStatus.FAILED,
                0
            );
            
            throw error;
        }
    }

    async verifyMissedChanges(userId: string, deviceId: string, since: number, projectId: string) {
        const appUser = await this.prisma.appUser.findUnique({
            where: {
                userIdentifier_projectId: {
                    userIdentifier: userId,
                    projectId: projectId
                }
            }
        });
        if (!appUser) {
            this.logger.warn(`User ${userId} not found`);
            return;
        }
        const sinceDate = new Date(since || 0);
        console.log(projectId, userId, deviceId, sinceDate);
        const missedChanges = await this.prisma.deviceChange.findMany({
            where: {
                projectId,
                userIdentifier: userId,
                deviceId: { not: deviceId },
                createdAt: { gt: sinceDate },
                deletedAt: null
            }
        });

        if (missedChanges.length > 0) {
            this.logger.log(`Device ${deviceId} has ${missedChanges.length} missed changes since ${sinceDate.toISOString()}`);
            this.syncGateway.notifyMissedChanges(userId, deviceId, missedChanges);
        } else {
            this.logger.log(`Device ${deviceId} has no missed changes since ${sinceDate.toISOString()}`);
        }

    }

    /**
     * Map the client-side change type to the database enum
     */
    private mapChangeType(clientChangeType: string): 'CREATE' | 'UPDATE' | 'DELETE' {
        switch (clientChangeType) {
            case ChangeType.INSERT:
                return 'CREATE';
            case ChangeType.UPDATE:
                return 'UPDATE';
            case ChangeType.DELETE:
                return 'DELETE';
            default:
                throw new BadRequestException(`Invalid change type: ${clientChangeType}`);
        }
    }

    /**
     * Map a database device change record to the client-side DTO format
     */
    /**
     * Notify other devices about new changes
     * @param userIdentifier The user identifier
     * @param sourceDeviceId The device ID that uploaded the changes (to exclude from notifications)
     * @param changeCount The number of changes uploaded
     */
    private async notifyOtherDevices(userIdentifier: string, sourceDeviceId: string, changeCount: number, projectId: string): Promise<void> {
        try {
            this.logger.log(`Notifying devices for user ${userIdentifier} about ${changeCount} new changes`);

            // Get the app user to find the project ID
            const appUser = await this.prisma.appUser.findUnique({
                where: {
                    userIdentifier_projectId: {
                        userIdentifier: userIdentifier,
                        projectId: projectId
                    }
                }
            });

            if (!appUser) {
                this.logger.warn(`User ${userIdentifier} not found for notification`);
                return;
            }

            // Prepare notification payload
            const notification = {
                type: 'new_changes',
                sourceDeviceId,
                changeCount,
                timestamp: Date.now()
            } as SyncNotificationDto;

            // Send notification to all other devices of this user
            this.syncGateway.notifyChanges(userIdentifier, notification);
        } catch (error) {
            this.logger.error(`Failed to notify devices: ${error.message}`, error.stack);
        }
    }

    private mapToSyncChange(dbChange: DeviceChange): SyncChange {
        let operation: ChangeType;
        switch (dbChange.changeType) {
            case 'CREATE':
                operation = ChangeType.INSERT;
                break;
            case 'UPDATE':
                operation = ChangeType.UPDATE;
                break;
            case 'DELETE':
                operation = ChangeType.DELETE;
                break;
            default:
                operation = ChangeType.UPDATE;
        }

        // Ensure data is properly handled
        const data = dbChange.data as Record<string, any>;
        if (!data || typeof data !== 'object') {
            this.logger.warn(`Invalid data format for change ${dbChange.id}: ${JSON.stringify(data)}`);
        }

        return {
            change_id: dbChange.changeId,
            table_name: dbChange.tableName,
            record_id: dbChange.recordId,
            operation: operation,
            data: data || {}, // Ensure we always have an object, even if empty
            timestamp: dbChange.clientTimestamp.getTime(),
            version: dbChange.clientVersion
        };
    }
}
