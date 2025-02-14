import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesGateway } from './changes.gateway';
import { ChangeLog } from '@prisma/client';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);
  private readonly MAX_CHANGES_PER_BATCH = 1000;
  private readonly MAX_BATCH_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  constructor(
    private prisma: PrismaService,
    private changesGateway: ChangesGateway,
  ) { }

  async processChange(userIdentifier: string, deviceId: string, changeSets: ChangeSetDto[]) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      // Split large change sets into batches
      const batches = this.splitIntoBatches(changeSets);
      const processedLogs: ChangeLog[] = [];

      for (const batch of batches) {
        const changeLog = await this.createChangLog(userIdentifier, deviceId, batch);
        this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'} (Batch size: ${batch.length})`);

        // Notify other devices through the gateway
        this.changesGateway.notifyChanges(deviceId, changeLog);
        processedLogs.push(changeLog);
      }

      return processedLogs.length === 1 ? processedLogs[0] : processedLogs;
    } catch (error) {
      this.logger.error('Error processing change', {
        error: error.message,
        userIdentifier,
        deviceId,
        stack: error.stack
      });
      throw new InternalServerErrorException('Error processing change');
    }
  }

  private splitIntoBatches(changeSets: ChangeSetDto[]): ChangeSetDto[][] {
    const batches: ChangeSetDto[][] = [];
    let currentBatch: ChangeSetDto[] = [];
    let currentBatchSize = 0;
    let currentChangeCount = 0;

    for (const changeSet of changeSets) {
      const changeSetSize = this.estimateChangeSetSize(changeSet);
      const changeCount = this.countChanges(changeSet);

      if (currentBatch.length > 0 &&
        (currentBatchSize + changeSetSize > this.MAX_BATCH_SIZE_BYTES ||
          currentChangeCount + changeCount > this.MAX_CHANGES_PER_BATCH)) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchSize = 0;
        currentChangeCount = 0;
      }

      currentBatch.push(changeSet);
      currentBatchSize += changeSetSize;
      currentChangeCount += changeCount;
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private estimateChangeSetSize(changeSet: ChangeSetDto): number {
    return Buffer.byteLength(JSON.stringify(changeSet));
  }

  private countChanges(changeSet: ChangeSetDto): number {
    let count = 0;
    for (const changeType of ['insertions', 'updates', 'deletions'] as const) {
      for (const tableChanges of Object.values(changeSet[changeType])) {
        count += tableChanges.rows.length;
      }
    }
    return count;
  }

  private async createChangLog(userIdentifier: string, deviceId: string, changeSets: ChangeSetDto[]) {
    this.logger.debug('Merging change sets and creating change log');

    const mergedChangeSet = this.mergeChangeSets(changeSets);

    const device = await this.prisma.device.findFirst({
      where: { deviceId, userIdentifier },
      select: { userIdentifier: true },
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found for user ${userIdentifier}`);
    }

    return await this.prisma.changeLog.create({
      data: {
        userIdentifier,
        deviceId,
        changeSet: JSON.stringify(mergedChangeSet),
        receivedAt: new Date(),
        processedAt: new Date(),
      },
    });
  }

  private isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const MAX_TIMESTAMP_DRIFT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return timestamp <= now && timestamp > now - MAX_TIMESTAMP_DRIFT;
  }

  private mergeChangeSets(changeSets: ChangeSetDto[]): ChangeSetDto {
    const mergedChangeSet: ChangeSetDto = {
      insertions: {},
      updates: {},
      deletions: {},
      timestamp: Math.max(...changeSets.map(cs => cs.timestamp)),
      version: Math.max(...changeSets.map(cs => cs.version)),
    };

    // Track the latest version of each record by primary key
    const latestVersions: Record<string, Record<string, {
      row: any;
      timestamp: number;
      version: number;
      changeType: 'insertions' | 'updates' | 'deletions';
    }>> = {};

    // First pass: determine the latest version of each record
    for (const changeSet of changeSets) {
      // Validate timestamp
      if (!this.isValidTimestamp(changeSet.timestamp)) {
        this.logger.warn(`Skipping change set with invalid timestamp: ${changeSet.timestamp}`);
        continue;
      }

      // Process deletions first, then updates, then insertions
      for (const changeType of ['deletions', 'updates', 'insertions'] as const) {
        for (const [tableName, tableChanges] of Object.entries(changeSet[changeType])) {
          if (!latestVersions[tableName]) {
            latestVersions[tableName] = {};
          }

          for (const row of tableChanges.rows) {
            const primaryKey = row.primaryKey;
            const timestamp = row.timestamp || changeSet.timestamp;
            const version = row.version || changeSet.version;

            // Skip if we already have a newer version of this record
            if (latestVersions[tableName][primaryKey] &&
              version <= latestVersions[tableName][primaryKey].version) {
              continue;
            }

            // Apply last-write-wins strategy based on timestamp and version
            if (!latestVersions[tableName][primaryKey] ||
              timestamp > latestVersions[tableName][primaryKey].timestamp ||
              (timestamp === latestVersions[tableName][primaryKey].timestamp &&
                version > latestVersions[tableName][primaryKey].version)) {
              latestVersions[tableName][primaryKey] = {
                row,
                timestamp,
                version,
                changeType
              };
            }
          }
        }
      }
    }

    // Second pass: organize changes by type
    for (const [tableName, versions] of Object.entries(latestVersions)) {
      for (const { row, changeType } of Object.values(versions)) {
        if (!mergedChangeSet[changeType][tableName]) {
          mergedChangeSet[changeType][tableName] = { rows: [] };
        }
        mergedChangeSet[changeType][tableName].rows.push(row);
      }
    }

    return mergedChangeSet;
  }
}
