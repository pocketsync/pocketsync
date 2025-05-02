import { Injectable, BadRequestException } from '@nestjs/common';
import { SyncChangeBatchDto, SyncChange, ChangeType, ChangeDataKey } from './dto/sync-change-batch.dto';
import { AppUser } from 'src/common/entities/app-user.entity';
import { Device } from 'src/common/entities/device.entity';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { ChangeOptimizerService } from './services/change-optimizer.service';

@Injectable()
export class SyncService {
    constructor(
        private prisma: PrismaService,
        private changeOptimizer: ChangeOptimizerService
    ) { }

    /**
     * Process and store incoming changes from a client
     */
    async uploadChanges(appUser: AppUser, device: Device, changeBatch: SyncChangeBatchDto) {
        if (!changeBatch.changes || changeBatch.changes.length === 0) {
            throw new BadRequestException('No changes provided');
        }

        if (changeBatch.change_count !== changeBatch.changes.length) {
            throw new BadRequestException('Change count does not match the number of changes');
        }

        const now = Date.now();
        const createdChanges = await Promise.all(changeBatch.changes.map(async (change) => {
            return this.prisma.deviceChanges.create({
                data: {
                    deviceId: device.deviceId,
                    userIdentifier: appUser.userIdentifier,
                    changeType: this.mapChangeType(change.operation),
                    tableName: change.tableName,
                    recordId: change.recordId,
                    data: Object.fromEntries(change.data),
                    clientTimestamp: new Date(change.timestamp),
                    clientVersion: change.version,
                    createdAt: new Date(now)
                }
            });
        }));

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

        return {
            success: true,
            timestamp: now,
            processed: createdChanges.length
        };
    }

    /**
     * Retrieve changes for a client since a specific timestamp
     * Applies optimization to reduce the number of changes sent
     */
    async downloadChanges(appUser: AppUser, device: Device, since: number) {
        if (!since || isNaN(since)) {
            throw new BadRequestException('Invalid since parameter');
        }
        const sinceDate = new Date(since);
        const changes = await this.prisma.deviceChanges.findMany({
            where: {
                userIdentifier: appUser.userIdentifier,
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

        return {
            changes: optimizedChanges,
            timestamp: Date.now(),
            count: optimizedChanges.length
        };
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
    private mapToSyncChange(dbChange: any): SyncChange {
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

        return {
            id: dbChange.id,
            tableName: dbChange.tableName,
            recordId: dbChange.recordId,
            operation: operation,
            data: new Map(
                Object.entries(dbChange.data).map(([key, value]) => {
                    return [key as ChangeDataKey, value];
                })
            ),
            timestamp: dbChange.clientTimestamp.getTime(),
            version: dbChange.clientVersion,
            synced: true
        };
    }
}
