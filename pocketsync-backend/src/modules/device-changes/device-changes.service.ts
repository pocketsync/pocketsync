import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceChangeQueryDto } from './dto/device-change-query.dto';
import { DeviceChangeResponseDto, DeviceChangeTimelineDto, DeviceChangeDto } from './dto/device-change-response.dto';
import { TableChangesSummaryDto, TableChangesSummaryResponseDto } from './dto/table-changes-summary.dto';
import { DeviceChange } from '@prisma/client';
import { DeviceChangeMapper } from './mappers/device-change.mapper';

@Injectable()
export class DeviceChangesService {
  private readonly logger = new Logger(DeviceChangesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get device changes with filtering and pagination
   */
  async getDeviceChanges(
    projectId: string,
    query: DeviceChangeQueryDto,
  ): Promise<DeviceChangeResponseDto> {
    const {
      tableName,
      recordId,
      changeType,
      deviceId,
      userIdentifier,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = { projectId };

    if (tableName) {
      where.tableName = tableName;
    }

    if (recordId) {
      where.recordId = recordId;
    }

    if (changeType) {
      where.changeType = changeType;
    }

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (userIdentifier) {
      where.userIdentifier = userIdentifier;
    }

    if (startDate || endDate) {
      where.clientTimestamp = {};

      if (startDate) {
        where.clientTimestamp.gte = new Date(startDate);
      }

      if (endDate) {
        where.clientTimestamp.lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.deviceChange.findMany({
        where,
        orderBy: {
          clientTimestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.deviceChange.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items: DeviceChangeMapper.toDtoList(items),
      total,
      page,
      limit,
      pages,
    };
  }

  /**
   * Get unique table names from device changes for a project
   */
  async getTableNames(projectId: string): Promise<string[]> {
    const result = await this.prisma.deviceChange.findMany({
      where: { projectId },
      select: { tableName: true },
      distinct: ['tableName'],
    });

    return result.map((item) => item.tableName);
  }

  /**
   * Get device changes for a specific record
   */
  async getRecordTimeline(
    projectId: string,
    tableName: string,
    recordId: string,
  ): Promise<DeviceChangeTimelineDto> {
    const changes = await this.prisma.deviceChange.findMany({
      where: {
        projectId,
        tableName,
        recordId,
      },
      orderBy: {
        clientTimestamp: 'desc',
      },
    });

    return {
      recordId,
      tableName,
      changes: DeviceChangeMapper.toDtoList(changes),
    };
  }

  /**
   * Get a summary of changes by table
   */
  async getChangesByTable(projectId: string): Promise<Record<string, number>> {
    const result = await this.prisma.$queryRaw<
      Array<{ tableName: string; count: bigint }>
    >`
      SELECT "table_name" as "tableName", COUNT(*) as "count"
      FROM "device_changes"
      WHERE "project_id" = ${projectId}::uuid
      GROUP BY "table_name"
      ORDER BY "count" DESC
    `;

    return result.reduce((acc, item) => {
      acc[item.tableName] = Number(item.count);
      return acc;
    }, {});
  }
  
  /**
   * Get a detailed summary of changes by table with counts by operation type
   */
  async getTableChangesSummary(projectId: string): Promise<TableChangesSummaryResponseDto> {
    const result = await this.prisma.$queryRaw<
      Array<{ tableName: string; changeType: string; count: bigint }>
    >`
      SELECT 
        "table_name" as "tableName", 
        "change_type" as "changeType", 
        COUNT(*) as "count"
      FROM "device_changes"
      WHERE "project_id" = ${projectId}::uuid
      GROUP BY "table_name", "change_type"
      ORDER BY "table_name", "change_type"
    `;
    
    // Group by table name
    const tableMap = new Map<string, { creates: number; updates: number; deletes: number; total: number }>();
    
    // Initialize with all tables
    const tables = await this.getTableNames(projectId);
    tables.forEach(tableName => {
      tableMap.set(tableName, { creates: 0, updates: 0, deletes: 0, total: 0 });
    });
    
    // Fill in the counts
    result.forEach(row => {
      const counts = tableMap.get(row.tableName) || { creates: 0, updates: 0, deletes: 0, total: 0 };
      const count = Number(row.count);
      
      switch (row.changeType) {
        case 'CREATE':
          counts.creates += count;
          break;
        case 'UPDATE':
          counts.updates += count;
          break;
        case 'DELETE':
          counts.deletes += count;
          break;
      }
      
      counts.total += count;
      tableMap.set(row.tableName, counts);
    });
    
    // Convert to DTO format
    const tables_summary = Array.from(tableMap.entries()).map(([tableName, counts]) => ({
      tableName,
      counts
    }));
    
    return { tables: tables_summary };
  }

  /**
   * Get a single device change by ID
   */
  async getDeviceChangeById(projectId: string, id: string): Promise<DeviceChangeDto | null> {
    const deviceChange = await this.prisma.deviceChange.findFirst({
      where: {
        id,
        projectId,
      },
    });
    
    return deviceChange ? DeviceChangeMapper.toDto(deviceChange) : null;
  }
}
