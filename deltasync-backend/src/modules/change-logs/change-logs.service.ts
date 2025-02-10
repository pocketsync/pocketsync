import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSetDto } from './dto/change-set.dto';
import { ChangesHandler } from './changes-handler';
import { DatabaseStateManager } from './database-state';
import { ChangeLog, Device } from '@prisma/client';

@Injectable()
export class ChangeLogsService {
  private readonly logger = new Logger(ChangeLogsService.name);

  constructor(
    private prisma: PrismaService,
    private changesHandler: ChangesHandler,
    private databaseStateManager: DatabaseStateManager,
  ) { }

  async processChange(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.log(`Processing change for user ${userIdentifier} from device ${deviceId}`);
    try {
      // 1. Record the change in the log (if it doesn't already exist)
      const changeLog = await this.createOrFindChangeLog(userIdentifier, deviceId, changeSet);
      this.logger.log(`Change log ${changeLog.id} ${changeLog.processedAt ? 'already exists' : 'created'}`);

      // 2. Get user's current database state
      const userDb = await this.getOrCreateUserDatabase(userIdentifier);
      this.logger.log(`Retrieved user database state, last synced at ${userDb.lastSyncedAt}`);

      // 3. Apply changes and resolve conflicts
      const updatedData = await this.resolveConflicts(userDb.data, changeSet);
      this.logger.log('Conflicts resolved, merging changes into database');

      // 4. Update the server-side database
      await this.prisma.userDatabase.update({
        where: { userIdentifier },
        data: {
          data: updatedData,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 5. Mark the change as processed
      await this.prisma.changeLog.update({
        where: { id: changeLog.id },
        data: { processedAt: new Date() },
      });

      // 6. Notify other devices
      await this.addToChangeQueue(userIdentifier, deviceId, changeSet);
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

  async fetchMissingChanges(device: Device, data: { lastProcessedChangeId: number }): Promise<ChangeLog []> {
    this.logger.debug(`Fetching changes after ID ${data.lastProcessedChangeId} for device ${device.deviceId}`);
    
    return this.prisma.changeLog.findMany({
      where: {
        userIdentifier: device.userIdentifier,
        id: { gt: data.lastProcessedChangeId },
        processedAt: { not: null },
        NOT: { deviceId: device.deviceId }
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  private async createOrFindChangeLog(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    this.logger.debug('Checking for existing change log within last 100s');

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

    return await this.prisma.changeLog.create({
      data: {
        userIdentifier,
        deviceId,
        changeSet: JSON.stringify(changeSet),
        receivedAt: new Date(),
      },
    });
  }

  private async getOrCreateUserDatabase(userIdentifier: string) {
    return await this.prisma.userDatabase.findFirst({
      where: { userIdentifier },
    }) || await this.prisma.userDatabase.create({
      data: {
        userIdentifier,
        data: this.databaseStateManager.serializeState(
          this.databaseStateManager.createEmptyState()
        ),
        lastSyncedAt: new Date(),
      },
    });
  }

  private async resolveConflicts(currentData: Uint8Array | undefined, changeSet: ChangeSetDto): Promise<Buffer> {
    return this.changesHandler.resolveConflicts(currentData, changeSet);
  }

  private async addToChangeQueue(userIdentifier: string, deviceId: string, changeSet: ChangeSetDto) {
    const sourceDevice = await this.prisma.device.findFirst({
      where: { deviceId, userIdentifier }
    });

    if (!sourceDevice) {
      throw new Error(`Source device ${deviceId} not found for user ${userIdentifier}`);
    }

    // No need to create device change logs anymore as we're tracking changes directly through the ChangeLog model
    this.logger.debug('Change queued for processing by other devices');
  }
}
