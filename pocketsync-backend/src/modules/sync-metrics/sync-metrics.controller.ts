import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncMetricsService } from './sync-metrics.service';
import { SyncMetricDto } from './dto/sync-metric.dto';
import { SyncMetricResponseDto } from './dto/responses/sync-metric-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SdkAuthGuard } from 'src/common/guards/sdk-auth.guard';
import { IUserDevice, UserDevice } from '../sync/decorators/user-device.decorator';

@ApiTags('Sync Metrics')
@Controller('sync-metrics')
export class SyncMetricsController {
  constructor(private readonly syncMetricsService: SyncMetricsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new metric from a client' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Project auth token',
    required: true
  })
  @ApiHeader({
    name: 'x-project-id',
    description: 'Project ID',
    required: true
  })
  @ApiResponse({
    status: 201,
    description: 'Metric recorded successfully',
    type: SyncMetricDto
  })
  @UseGuards(SdkAuthGuard)
  async recordMetric(
    @UserDevice() userDevice: IUserDevice,
    @Headers('x-project-id') projectId: string,
    @Body() metricData: { metricType: string; value: number; metadata?: Record<string, any> }
  ): Promise<SyncMetricDto> {
    return this.syncMetricsService.recordMetric(
      projectId,
      metricData.metricType,
      metricData.value,
      metricData.metadata,
      userDevice.appUser.userIdentifier,
      userDevice.device.deviceId
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get metrics for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'userIdentifier', description: 'Filter by user identifier', required: false })
  @ApiQuery({ name: 'deviceId', description: 'Filter by device ID', required: false })
  @ApiQuery({ name: 'metricType', description: 'Filter by metric type', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date (ISO format)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date (ISO format)', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of metrics to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of metrics to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Metrics found',
    type: SyncMetricResponseDto
  })
  @UseGuards(JwtAuthGuard)
  async getMetricsByProject(
    @Param('projectId') projectId: string,
    @Query('userIdentifier') userIdentifier?: string,
    @Query('deviceId') deviceId?: string,
    @Query('metricType') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncMetricResponseDto> {
    const filter: any = {
      userIdentifier,
      deviceId,
      metricType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const { metrics, total } = await this.syncMetricsService.getMetricsByProject(
      projectId,
      filter,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      metrics,
      total,
      success: true
    };
  }

  @Get('device/:deviceId/user/:userIdentifier')
  @ApiOperation({ summary: 'Get metrics for a specific device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiQuery({ name: 'metricType', description: 'Filter by metric type', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date (ISO format)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date (ISO format)', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of metrics to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of metrics to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Metrics found',
    type: SyncMetricResponseDto
  })
  @UseGuards(JwtAuthGuard)
  async getMetricsByDevice(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string,
    @Query('metricType') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncMetricResponseDto> {
    const filter: any = {
      metricType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const { metrics, total } = await this.syncMetricsService.getMetricsByDevice(
      deviceId,
      userIdentifier,
      filter,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      metrics,
      total,
      success: true
    };
  }

  @Get('aggregate/:projectId/:metricType')
  @ApiOperation({ summary: 'Get aggregated metrics for a specific project and metric type' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'metricType', description: 'Metric type' })
  @ApiQuery({ name: 'interval', description: 'Aggregation interval', required: true, enum: ['hour', 'day', 'week', 'month'] })
  @ApiQuery({ name: 'startDate', description: 'Start date (ISO format)', required: true })
  @ApiQuery({ name: 'endDate', description: 'End date (ISO format)', required: true })
  @ApiResponse({
    status: 200,
    description: 'Aggregated metrics found',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              average: { type: 'number' },
              min: { type: 'number' },
              max: { type: 'number' },
              count: { type: 'integer' }
            }
          }
        },
        success: { type: 'boolean' }
      }
    }
  })
  @UseGuards(JwtAuthGuard)
  async getAggregatedMetrics(
    @Param('projectId') projectId: string,
    @Param('metricType') metricType: string,
    @Query('interval') interval: 'hour' | 'day' | 'week' | 'month',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{ data: any[]; success: boolean }> {
    const data = await this.syncMetricsService.getAggregatedMetrics(
      projectId,
      metricType,
      interval,
      new Date(startDate),
      new Date(endDate)
    );

    return {
      data,
      success: true
    };
  }
}
