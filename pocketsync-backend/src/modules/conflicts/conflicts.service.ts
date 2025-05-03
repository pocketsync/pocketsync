import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictDto } from './dto/conflict.dto';
import { ReportConflictDto } from './dto/report-conflict.dto';
import { ConflictResolutionStrategy } from '@prisma/client';
import { SyncLogsService } from '../sync-logs/sync-logs.service';

@Injectable()
export class ConflictsService {
  private readonly logger = new Logger(ConflictsService.name);

  constructor(
    private prisma: PrismaService,
    private syncLogsService: SyncLogsService
  ) {}

  /**
   * Report a new conflict from a client
   */
  async reportConflict(
    projectId: string,
    userIdentifier: string,
    deviceId: string,
    reportConflict: ReportConflictDto,
    syncSessionId?: string
  ): Promise<ConflictDto> {
    this.logger.log(`Reporting conflict for record ${reportConflict.recordId} in table ${reportConflict.tableName}`);
    
    const conflict = await this.prisma.conflict.create({
      data: {
        projectId,
        userIdentifier,
        deviceId,
        tableName: reportConflict.tableName,
        recordId: reportConflict.recordId,
        clientData: reportConflict.clientData,
        serverData: reportConflict.serverData,
        resolutionStrategy: reportConflict.resolutionStrategy,
        resolvedData: reportConflict.resolvedData,
        metadata: reportConflict.metadata,
        syncSessionId
      }
    });

    // Log the conflict
    await this.syncLogsService.createLog(
      projectId,
      `Conflict detected and resolved for record ${reportConflict.recordId} in table ${reportConflict.tableName}`,
      'INFO',
      {
        conflictId: conflict.id,
        resolutionStrategy: reportConflict.resolutionStrategy,
        tableName: reportConflict.tableName,
        recordId: reportConflict.recordId
      },
      userIdentifier,
      deviceId,
      syncSessionId
    );

    return this.mapToDto(conflict);
  }

  /**
   * Get conflicts for a specific project with optional filtering
   */
  async getConflictsByProject(
    projectId: string,
    filter: {
      userIdentifier?: string;
      deviceId?: string;
      tableName?: string;
      recordId?: string;
      resolutionStrategy?: ConflictResolutionStrategy;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ conflicts: ConflictDto[]; total: number }> {
    const where: any = {
      projectId,
      ...filter.userIdentifier && { userIdentifier: filter.userIdentifier },
      ...filter.deviceId && { deviceId: filter.deviceId },
      ...filter.tableName && { tableName: filter.tableName },
      ...filter.recordId && { recordId: filter.recordId },
      ...filter.resolutionStrategy && { resolutionStrategy: filter.resolutionStrategy },
      ...filter.startDate && { detectedAt: { gte: filter.startDate } },
      ...filter.endDate && { detectedAt: { lte: filter.endDate } }
    };

    // If both start and end dates are provided, combine them
    if (filter.startDate && filter.endDate) {
      where.detectedAt = {
        gte: filter.startDate,
        lte: filter.endDate
      };
    }

    const [conflicts, total] = await Promise.all([
      this.prisma.conflict.findMany({
        where,
        orderBy: {
          detectedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.conflict.count({ where })
    ]);

    return {
      conflicts: conflicts.map(conflict => this.mapToDto(conflict)),
      total
    };
  }

  /**
   * Get conflicts for a specific sync session
   */
  async getConflictsBySession(
    syncSessionId: string,
    limit = 50,
    offset = 0
  ): Promise<{ conflicts: ConflictDto[]; total: number }> {
    const [conflicts, total] = await Promise.all([
      this.prisma.conflict.findMany({
        where: { syncSessionId },
        orderBy: {
          detectedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.conflict.count({ where: { syncSessionId } })
    ]);

    return {
      conflicts: conflicts.map(conflict => this.mapToDto(conflict)),
      total
    };
  }

  /**
   * Get conflicts for a specific record
   */
  async getConflictsByRecord(
    tableName: string,
    recordId: string,
    limit = 50,
    offset = 0
  ): Promise<{ conflicts: ConflictDto[]; total: number }> {
    const [conflicts, total] = await Promise.all([
      this.prisma.conflict.findMany({
        where: { 
          tableName,
          recordId
        },
        orderBy: {
          detectedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.conflict.count({ 
        where: { 
          tableName,
          recordId
        } 
      })
    ]);

    return {
      conflicts: conflicts.map(conflict => this.mapToDto(conflict)),
      total
    };
  }

  /**
   * Get conflict by ID
   */
  async getConflictById(id: string): Promise<ConflictDto> {
    const conflict = await this.prisma.conflict.findUnique({
      where: { id }
    });

    if (!conflict) {
      throw new NotFoundException(`Conflict with ID ${id} not found`);
    }

    return this.mapToDto(conflict);
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(conflict: any): ConflictDto {
    return {
      id: conflict.id,
      projectId: conflict.projectId,
      userIdentifier: conflict.userIdentifier,
      deviceId: conflict.deviceId,
      tableName: conflict.tableName,
      recordId: conflict.recordId,
      clientData: conflict.clientData,
      serverData: conflict.serverData,
      resolutionStrategy: conflict.resolutionStrategy,
      resolvedData: conflict.resolvedData,
      detectedAt: conflict.detectedAt,
      resolvedAt: conflict.resolvedAt,
      syncSessionId: conflict.syncSessionId,
      metadata: conflict.metadata
    };
  }
}
