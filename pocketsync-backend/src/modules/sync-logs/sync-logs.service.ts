import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel } from '@prisma/client';
import { SyncLogDto } from './dto/sync-log.dto';

@Injectable()
export class SyncLogsService {
  private readonly logger = new Logger(SyncLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new sync log entry
   */
  async createLog(
    projectId: string,
    message: string,
    level: LogLevel = LogLevel.INFO,
    metadata?: Record<string, any>,
    userIdentifier?: string,
    deviceId?: string,
    syncSessionId?: string
  ): Promise<SyncLogDto> {
    this.logger.log(`Creating new sync log for project ${projectId}: ${message}`);
    
    const log = await this.prisma.syncLog.create({
      data: {
        projectId,
        message,
        level,
        metadata,
        userIdentifier,
        deviceId,
        syncSessionId
      }
    });

    return this.mapToDto(log);
  }

  /**
   * Get logs for a specific project with optional filtering
   */
  async getLogsByProject(
    projectId: string,
    filter: {
      userIdentifier?: string;
      deviceId?: string;
      level?: LogLevel;
      syncSessionId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ logs: SyncLogDto[]; total: number }> {
    const where: any = {
      projectId,
      ...filter.userIdentifier && { userIdentifier: filter.userIdentifier },
      ...filter.deviceId && { deviceId: filter.deviceId },
      ...filter.level && { level: filter.level },
      ...filter.syncSessionId && { syncSessionId: filter.syncSessionId },
      ...filter.startDate && { timestamp: { gte: filter.startDate } },
      ...filter.endDate && { timestamp: { lte: filter.endDate } }
    };

    // If both start and end dates are provided, combine them
    if (filter.startDate && filter.endDate) {
      where.timestamp = {
        gte: filter.startDate,
        lte: filter.endDate
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.syncLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.syncLog.count({ where })
    ]);

    return {
      logs: logs.map(log => this.mapToDto(log)),
      total
    };
  }

  /**
   * Get logs for a specific sync session
   */
  async getLogsBySession(
    syncSessionId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: SyncLogDto[]; total: number }> {
    const [logs, total] = await Promise.all([
      this.prisma.syncLog.findMany({
        where: { syncSessionId },
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.syncLog.count({ where: { syncSessionId } })
    ]);

    return {
      logs: logs.map(log => this.mapToDto(log)),
      total
    };
  }

  /**
   * Get logs for a specific device
   */
  async getLogsByDevice(
    deviceId: string,
    userIdentifier: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: SyncLogDto[]; total: number }> {
    const [logs, total] = await Promise.all([
      this.prisma.syncLog.findMany({
        where: { 
          deviceId,
          userIdentifier
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.syncLog.count({ 
        where: { 
          deviceId,
          userIdentifier
        } 
      })
    ]);

    return {
      logs: logs.map(log => this.mapToDto(log)),
      total
    };
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(log: any): SyncLogDto {
    return {
      id: log.id,
      projectId: log.projectId,
      userIdentifier: log.userIdentifier,
      deviceId: log.deviceId,
      message: log.message,
      level: log.level,
      timestamp: log.timestamp,
      metadata: log.metadata,
      syncSessionId: log.syncSessionId
    };
  }
}
