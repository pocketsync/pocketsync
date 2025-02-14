import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesGateway } from './changes.gateway';
import { ChangeLog } from '@prisma/client';
import { BatchProcessorService } from './services/batch-processor.service';
import { ChangeMergerService } from './services/change-merger.service';
import { ChangeStatsService } from './services/change-stats.service';
import { DeviceValidatorService } from './services/device-validator.service';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);
  private readonly MAX_CHANGES_PER_BATCH = 1000;
  private readonly MAX_BATCH_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  // Statistics for monitoring skipped changes
  private skippedChangeStats = {
    invalidTimestamp: 0,
    olderVersion: 0,
    total: 0,
    lastReset: new Date()
  };

  constructor(
    private prisma: PrismaService,
    private changesGateway: ChangesGateway,
    private batchProcessor: BatchProcessorService,
    private changeMerger: ChangeMergerService,
    private changeStats: ChangeStatsService,
    private deviceValidator: DeviceValidatorService,
  ) {}

  async processChange(userIdentifier: string, deviceId: string, changeSets: ChangeSetDto[]) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      await this.deviceValidator.validateDevice(userIdentifier, deviceId);
      
      const batches = this.batchProcessor.splitIntoBatches(changeSets);
      const processedLogs: ChangeLog[] = [];

      for (const batch of batches) {
        const mergedChangeSet = this.changeMerger.mergeChangeSets(batch);
        const changeLog = await this.createChangeLog(userIdentifier, deviceId, mergedChangeSet);
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
}
