import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncMetricDto } from './dto/sync-metric.dto';

@Injectable()
export class SyncMetricsService {
  private readonly logger = new Logger(SyncMetricsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Record a new sync metric
   */
  async recordMetric(
    projectId: string,
    metricType: string,
    value: number,
    metadata?: Record<string, any>,
    userIdentifier?: string,
    deviceId?: string
  ): Promise<SyncMetricDto> {
    this.logger.log(`Recording metric ${metricType} with value ${value} for project ${projectId}`);
    
    const metric = await this.prisma.syncMetric.create({
      data: {
        projectId,
        metricType,
        value,
        metadata,
        userIdentifier,
        deviceId
      }
    });

    return this.mapToDto(metric);
  }

  /**
   * Get metrics for a specific project with optional filtering
   */
  async getMetricsByProject(
    projectId: string,
    filter: {
      userIdentifier?: string;
      deviceId?: string;
      metricType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ metrics: SyncMetricDto[]; total: number }> {
    const where: any = {
      projectId,
      ...filter.userIdentifier && { userIdentifier: filter.userIdentifier },
      ...filter.deviceId && { deviceId: filter.deviceId },
      ...filter.metricType && { metricType: filter.metricType },
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

    const [metrics, total] = await Promise.all([
      this.prisma.syncMetric.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.syncMetric.count({ where })
    ]);

    return {
      metrics: metrics.map(metric => this.mapToDto(metric)),
      total
    };
  }

  /**
   * Get metrics for a specific device
   */
  async getMetricsByDevice(
    deviceId: string,
    userIdentifier: string,
    filter: {
      metricType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ metrics: SyncMetricDto[]; total: number }> {
    const where: any = {
      deviceId,
      userIdentifier,
      ...filter.metricType && { metricType: filter.metricType },
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

    const [metrics, total] = await Promise.all([
      this.prisma.syncMetric.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.syncMetric.count({ where })
    ]);

    return {
      metrics: metrics.map(metric => this.mapToDto(metric)),
      total
    };
  }

  /**
   * Get aggregated metrics for a specific project
   */
  async getAggregatedMetrics(
    projectId: string,
    metricType: string,
    interval: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<{ timestamp: Date; average: number; min: number; max: number; count: number }[]> {
    // This is a complex query that would typically use raw SQL or a specialized time-series database
    // For PostgreSQL, we can use date_trunc to group by time intervals
    
    const result = await this.prisma.$queryRaw`
      SELECT 
        date_trunc(${interval}, timestamp) as time_bucket,
        AVG(value) as average,
        MIN(value) as min,
        MAX(value) as max,
        COUNT(*) as count
      FROM sync_metrics
      WHERE 
        project_id = ${projectId}
        AND metric_type = ${metricType}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    return (result as any[]).map(row => ({
      timestamp: row.time_bucket,
      average: parseFloat(row.average),
      min: parseFloat(row.min),
      max: parseFloat(row.max),
      count: parseInt(row.count, 10)
    }));
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(metric: any): SyncMetricDto {
    return {
      id: metric.id,
      projectId: metric.projectId,
      userIdentifier: metric.userIdentifier,
      deviceId: metric.deviceId,
      metricType: metric.metricType,
      value: metric.value,
      timestamp: metric.timestamp,
      metadata: metric.metadata
    };
  }
}
