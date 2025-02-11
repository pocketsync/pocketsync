import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { DatabaseStateManager } from './database-state';
import { ChangeLog, Device } from '@prisma/client';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);

  constructor(
    private prisma: PrismaService,
    private databaseStateManager: DatabaseStateManager,
  ) { }

  async processChange(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      // 1. Record the change in the log (if it doesn't already exist)
      const changeLog = await this.createOrFindChangeLog(userIdentifier, deviceId, changeSet);
      this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'}`);

      // 2. Mark the change as processed
      await this.prisma.changeLog.update({
        where: { id: changeLog.id },
        data: { processedAt: new Date() },
      });

      this.logger.log('Change processing completed successfully');

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

  async fetchMissingChanges(device: Device, data: { lastProcessedChangeId: number }): Promise<ChangeLog[]> {
    this.logger.debug(`Fetching changes after ID ${data.lastProcessedChangeId} for device ${device.deviceId}`);

    const changes = await this.prisma.changeLog.findMany({
      where: {
        userIdentifier: device.userIdentifier,
        id: { gt: data.lastProcessedChangeId },
        processedAt: { not: null },
        deviceId: { not: device.deviceId },
      },
      orderBy: {
        id: 'asc'
      }
    });
    this.logger.debug(`Found ${changes.length} changes for ${device.deviceId}`);
    return changes;
  }

  private async createOrFindChangeLog(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.debug('Checking for existing change log within last 100s');

    const globalIds = new Set<string>();
    ['insertions', 'updates', 'deletions'].forEach(changeType => {
      const tables = changeSet[changeType] as Record<string, { rows?: Array<any> }>;

      if (tables) {
        Object.values(tables).forEach(table => {
          if (table?.rows?.length) {
            table.rows.forEach(row => {
              const globalId = row.global_id;
              if (!globalId) {
                this.logger.error('Row missing global_id', { row: JSON.stringify(row) });
                throw new Error('Row missing global_id');
              }
              globalIds.add(globalId);
            });
          }
        });
      }
    });

    if (globalIds.size === 0) {
      this.logger.error('No global IDs found in change set', { changeSet: JSON.stringify(changeSet) });
      throw new Error('No row IDs found in change set');
    }

    const device = await this.prisma.device.findFirst({
      where: {
        deviceId,
        userIdentifier,
      },
      select: {
        userIdentifier: true,
        appUser: {
          select: {
            userIdentifier: true
          }
        }
      }
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found for user ${userIdentifier}`);
    }

    const existingChangeLog = await this.prisma.changeLog.findFirst({
      where: {
        userIdentifier,
        deviceId,
        changeSet: { equals: JSON.stringify(changeSet) },
        receivedAt: {
          gte: new Date(Date.now() - 100000),
        },
      },
    });

    if (existingChangeLog) {
      return existingChangeLog;
    }

    // Create a new change log with the first global ID
    const firstGlobalId = Array.from(globalIds)[0];
    this.logger.debug(`Creating new change log with global ID: ${firstGlobalId}`);

    return await this.prisma.changeLog.create({
      data: {
        userIdentifier,
        deviceId,
        originalId: firstGlobalId,  // Store the global_id in originalId for backwards compatibility
        changeSet: JSON.stringify(changeSet),
        receivedAt: new Date(),
      },
    });
  }
}
