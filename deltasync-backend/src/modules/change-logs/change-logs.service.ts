import { Injectable, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesGateway } from './changes.gateway';
import { ChangeLog } from '@prisma/client';
import { BatchProcessorService } from './services/batch-processor.service';
import { ChangeMergerService } from './services/change-merger.service';
import { ChangeStatsService } from './services/change-stats.service';
import { DeviceValidatorService } from './services/device-validator.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private changesGateway: ChangesGateway,
    private batchProcessor: BatchProcessorService,
    private changeMerger: ChangeMergerService,
    private deviceValidator: DeviceValidatorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async processChange(userIdentifier: string, deviceId: string, changeSets: ChangeSetDto[]) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      // Check if this exact change set was recently processed
      const changeSetHash = this.computeChangeSetHash(changeSets);
      const cacheKey = `changes:${userIdentifier}:${deviceId}:${changeSetHash}`;
      
      const cachedResult = await this.cacheManager.get(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Returning cached result for change set ${changeSetHash}`);
        return cachedResult;
      }

      await this.deviceValidator.validateDevice(userIdentifier, deviceId);
      
      const batches = this.batchProcessor.splitIntoBatches(changeSets);
      const processedLogs: ChangeLog[] = [];

      for (const batch of batches) {
        const batchHash = this.computeChangeSetHash(batch);
        const mergedChangeSet = await this.getCachedOrMergeChanges(batchHash, batch);
        const changeLog = await this.createChangeLog(userIdentifier, deviceId, mergedChangeSet);
        await this.notifyDevicesWithCache(deviceId, changeLog);
        processedLogs.push(changeLog);
      }

      const result = processedLogs.length === 1 ? processedLogs[0] : processedLogs;
      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
      
      return result;
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

  private async createChangeLog(userIdentifier: string, deviceId: string, mergedChangeSet: ChangeSetDto) {
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

  private computeChangeSetHash(changeSets: ChangeSetDto[]): string {
    return createHash('sha256')
      .update(JSON.stringify(changeSets))
      .digest('hex');
  }

  private async getCachedOrMergeChanges(hash: string, batch: ChangeSetDto[]): Promise<ChangeSetDto> {
    const cacheKey = `merged:${hash}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as ChangeSetDto;
    }

    const merged = this.changeMerger.mergeChangeSets(batch);
    await this.cacheManager.set(cacheKey, merged, this.CACHE_TTL);
    return merged;
  }

  private async notifyDevicesWithCache(deviceId: string, changeLog: ChangeLog): Promise<void> {
    const notificationKey = `notification:${changeLog.id}:${deviceId}`;
    const hasNotified = await this.cacheManager.get(notificationKey);

    if (!hasNotified) {
      this.changesGateway.notifyChanges(deviceId, changeLog);
      await this.cacheManager.set(notificationKey, true, this.CACHE_TTL);
    }
  }
}
