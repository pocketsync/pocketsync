import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeviceChangesService } from './device-changes.service';
import { DeviceChangeQueryDto } from './dto/device-change-query.dto';
import { DeviceChangeResponseDto, DeviceChangeTimelineDto } from './dto/device-change-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('device-changes')
@Controller('projects/:projectId/device-changes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceChangesController {
  constructor(private readonly deviceChangesService: DeviceChangesService) {}

  @Get()
  @ApiOperation({ summary: 'Get device changes with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of device changes with pagination',
    type: DeviceChangeResponseDto 
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getDeviceChanges(
    @Param('projectId') projectId: string,
    @Query() query: DeviceChangeQueryDto,
  ): Promise<DeviceChangeResponseDto> {
    return this.deviceChangesService.getDeviceChanges(projectId, query);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Get unique table names from device changes' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of unique table names',
    type: [String] 
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getTableNames(@Param('projectId') projectId: string): Promise<string[]> {
    return this.deviceChangesService.getTableNames(projectId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get a summary of changes by table' })
  @ApiResponse({ 
    status: 200, 
    description: 'Summary of changes by table',
    schema: {
      type: 'object',
      additionalProperties: { type: 'number' }
    }
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getChangesByTable(@Param('projectId') projectId: string): Promise<Record<string, number>> {
    return this.deviceChangesService.getChangesByTable(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single device change by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Device change details',
    type: DeviceChangeResponseDto 
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Device change ID' })
  async getDeviceChangeById(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.deviceChangesService.getDeviceChangeById(projectId, id);
  }

  @Get('tables/:tableName/records/:recordId/timeline')
  @ApiOperation({ summary: 'Get timeline of changes for a specific record' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timeline of changes for a specific record',
    type: DeviceChangeTimelineDto 
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'tableName', description: 'Table name' })
  @ApiParam({ name: 'recordId', description: 'Record ID' })
  async getRecordTimeline(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string,
  ): Promise<DeviceChangeTimelineDto> {
    return this.deviceChangesService.getRecordTimeline(projectId, tableName, recordId);
  }
}
