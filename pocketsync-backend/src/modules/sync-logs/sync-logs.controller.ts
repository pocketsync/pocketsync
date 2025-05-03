import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncLogsService } from './sync-logs.service';
import { SyncLogDto } from './dto/sync-log.dto';
import { SyncLogResponseDto } from './dto/responses/sync-log-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LogLevel } from '@prisma/client';

@ApiTags('Sync Logs')
@ApiHeader({
  name: 'Authorization',
  description: 'JWT token',
  required: true
})
@Controller('sync-logs')
@UseGuards(JwtAuthGuard)
export class SyncLogsController {
  constructor(private readonly syncLogsService: SyncLogsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get logs for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'userIdentifier', description: 'Filter by user identifier', required: false })
  @ApiQuery({ name: 'deviceId', description: 'Filter by device ID', required: false })
  @ApiQuery({ name: 'level', description: 'Filter by log level', required: false, enum: LogLevel })
  @ApiQuery({ name: 'syncSessionId', description: 'Filter by sync session ID', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date (ISO format)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date (ISO format)', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of logs to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of logs to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Logs found',
    type: SyncLogResponseDto
  })
  async getLogsByProject(
    @Param('projectId') projectId: string,
    @Query('userIdentifier') userIdentifier?: string,
    @Query('deviceId') deviceId?: string,
    @Query('level') level?: LogLevel,
    @Query('syncSessionId') syncSessionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncLogResponseDto> {
    const filter: any = {
      userIdentifier,
      deviceId,
      level,
      syncSessionId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const { logs, total } = await this.syncLogsService.getLogsByProject(
      projectId,
      filter,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      logs,
      total,
      success: true
    };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get logs for a specific sync session' })
  @ApiParam({ name: 'sessionId', description: 'Sync session ID' })
  @ApiQuery({ name: 'limit', description: 'Number of logs to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of logs to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Logs found',
    type: SyncLogResponseDto
  })
  async getLogsBySession(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncLogResponseDto> {
    const { logs, total } = await this.syncLogsService.getLogsBySession(
      sessionId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      logs,
      total,
      success: true
    };
  }

  @Get('device/:deviceId/user/:userIdentifier')
  @ApiOperation({ summary: 'Get logs for a specific device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiQuery({ name: 'limit', description: 'Number of logs to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of logs to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Logs found',
    type: SyncLogResponseDto
  })
  async getLogsByDevice(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncLogResponseDto> {
    const { logs, total } = await this.syncLogsService.getLogsByDevice(
      deviceId,
      userIdentifier,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      logs,
      total,
      success: true
    };
  }
}
