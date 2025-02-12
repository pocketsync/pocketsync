import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangeLog, Device } from '@prisma/client';
import { ChangesGateway } from './changes.gateway';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);

  constructor(
    private prisma: PrismaService,
    private changesGateway: ChangesGateway,
  ) { }

  async processChange(userIdentifier: string, deviceId: string, changeSets: ChangeSetDto[]) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      const changeLog = await this.createChangLog(userIdentifier, deviceId, changeSets);
      this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'}`);

      // Notify other devices through the gateway
      this.changesGateway.notifyChanges(deviceId, changeLog);

      return changeLog;
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

  private mergeChangeSets(changeSets: ChangeSetDto[]): ChangeSetDto {
    const mergedChangeSet: ChangeSetDto = {
      insertions: {},
      updates: {},
      deletions: {},
      timestamp: Math.max(...changeSets.map(cs => cs.timestamp)),
      version: Math.max(...changeSets.map(cs => cs.version)),
    };

    for (const changeSet of changeSets) {
      for (const changeType of ['insertions', 'updates', 'deletions'] as const) {
        for (const [tableName, tableChanges] of Object.entries(changeSet[changeType])) {
          if (!mergedChangeSet[changeType][tableName]) {
            mergedChangeSet[changeType][tableName] = { rows: [] };
          }
          mergedChangeSet[changeType][tableName].rows.push(...tableChanges.rows);
        }
      }
    }

    return mergedChangeSet;
  }
}
