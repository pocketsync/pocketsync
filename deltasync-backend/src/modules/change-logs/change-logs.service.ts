import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
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

    // Track the latest version of each record by primary key
    const latestVersions: Record<string, Record<string, { row: any; timestamp: number }>> = {};

    for (const changeSet of changeSets) {
      for (const changeType of ['insertions', 'updates', 'deletions'] as const) {
        for (const [tableName, tableChanges] of Object.entries(changeSet[changeType])) {
          if (!mergedChangeSet[changeType][tableName]) {
            mergedChangeSet[changeType][tableName] = { rows: [] };
          }
          if (!latestVersions[tableName]) {
            latestVersions[tableName] = {};
          }

          // Process each row using the Row class structure
          for (const row of tableChanges.rows) {
            const primaryKey = row.primaryKey;
            const timestamp = row.timestamp || changeSet.timestamp;

            // Apply last-write-wins strategy based on timestamp
            if (!latestVersions[tableName][primaryKey] ||
              timestamp > latestVersions[tableName][primaryKey].timestamp) {
              latestVersions[tableName][primaryKey] = { row, timestamp };
            }
          }
        }
      }
    }

    // Populate the merged change set with the latest versions
    for (const changeType of ['insertions', 'updates', 'deletions'] as const) {
      for (const [tableName, versions] of Object.entries(latestVersions)) {
        if (Object.keys(versions).length > 0) {
          mergedChangeSet[changeType][tableName] = {
            rows: Object.values(versions).map(v => v.row)
          };
        }
      }
    }

    return mergedChangeSet;
  }
}
