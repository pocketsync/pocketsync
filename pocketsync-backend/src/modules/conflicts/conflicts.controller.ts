import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConflictsService } from './conflicts.service';
import { ConflictDto } from './dto/conflict.dto';
import { ReportConflictDto } from './dto/report-conflict.dto';
import { ConflictResponseDto } from './dto/responses/conflict-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SdkAuthGuard } from 'src/common/guards/sdk-auth.guard';
import { ConflictResolutionStrategy } from '@prisma/client';
import { IUserDevice, UserDevice } from '../sync/decorators/user-device.decorator';

@ApiTags('Conflicts')
@Controller('conflicts')
export class ConflictsController {
  constructor(private readonly conflictsService: ConflictsService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a conflict from a client' })
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
    description: 'Conflict reported successfully',
    type: ConflictDto
  })
  @UseGuards(SdkAuthGuard)
  async reportConflict(
    @UserDevice() userDevice: IUserDevice,
    @Body() reportConflictDto: ReportConflictDto,
    @Query('syncSessionId') syncSessionId?: string
  ): Promise<ConflictDto> {
    return this.conflictsService.reportConflict(
      userDevice.appUser.projectId,
      userDevice.appUser.userIdentifier,
      userDevice.device.deviceId,
      reportConflictDto,
      syncSessionId
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get conflicts for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'userIdentifier', description: 'Filter by user identifier', required: false })
  @ApiQuery({ name: 'deviceId', description: 'Filter by device ID', required: false })
  @ApiQuery({ name: 'tableName', description: 'Filter by table name', required: false })
  @ApiQuery({ name: 'recordId', description: 'Filter by record ID', required: false })
  @ApiQuery({ name: 'resolutionStrategy', description: 'Filter by resolution strategy', required: false, enum: ConflictResolutionStrategy })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date (ISO format)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date (ISO format)', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of conflicts to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of conflicts to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conflicts found',
    type: ConflictResponseDto
  })
  @UseGuards(JwtAuthGuard)
  async getConflictsByProject(
    @Param('projectId') projectId: string,
    @Query('userIdentifier') userIdentifier?: string,
    @Query('deviceId') deviceId?: string,
    @Query('tableName') tableName?: string,
    @Query('recordId') recordId?: string,
    @Query('resolutionStrategy') resolutionStrategy?: ConflictResolutionStrategy,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ConflictResponseDto> {
    const filter: any = {
      userIdentifier,
      deviceId,
      tableName,
      recordId,
      resolutionStrategy,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const { conflicts, total } = await this.conflictsService.getConflictsByProject(
      projectId,
      filter,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      conflicts,
      total,
      success: true
    };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get conflicts for a specific sync session' })
  @ApiParam({ name: 'sessionId', description: 'Sync session ID' })
  @ApiQuery({ name: 'limit', description: 'Number of conflicts to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of conflicts to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conflicts found',
    type: ConflictResponseDto
  })
  @UseGuards(JwtAuthGuard)
  async getConflictsBySession(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ConflictResponseDto> {
    const { conflicts, total } = await this.conflictsService.getConflictsBySession(
      sessionId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      conflicts,
      total,
      success: true
    };
  }

  @Get('record/:tableName/:recordId')
  @ApiOperation({ summary: 'Get conflicts for a specific record' })
  @ApiParam({ name: 'tableName', description: 'Table name' })
  @ApiParam({ name: 'recordId', description: 'Record ID' })
  @ApiQuery({ name: 'limit', description: 'Number of conflicts to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of conflicts to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conflicts found',
    type: ConflictResponseDto
  })
  @UseGuards(JwtAuthGuard)
  async getConflictsByRecord(
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ConflictResponseDto> {
    const { conflicts, total } = await this.conflictsService.getConflictsByRecord(
      tableName,
      recordId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      conflicts,
      total,
      success: true
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conflict by ID' })
  @ApiParam({ name: 'id', description: 'Conflict ID' })
  @ApiResponse({
    status: 200,
    description: 'Conflict found',
    type: ConflictDto
  })
  @ApiResponse({ status: 404, description: 'Conflict not found' })
  @UseGuards(JwtAuthGuard)
  async getConflictById(@Param('id') id: string): Promise<ConflictDto> {
    return this.conflictsService.getConflictById(id);
  }
}
