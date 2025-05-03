import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncSessionsService } from './sync-sessions.service';
import { SyncSessionDto } from './dto/sync-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sync Sessions')
@ApiHeader({
  name: 'Authorization',
  description: 'JWT token',
  required: true
})
@Controller('sync-sessions')
@UseGuards(JwtAuthGuard)
export class SyncSessionsController {
  constructor(private readonly syncSessionsService: SyncSessionsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get sync session by ID' })
  @ApiParam({ name: 'id', description: 'Sync session ID' })
  @ApiResponse({
    status: 200,
    description: 'Sync session found',
    type: SyncSessionDto
  })
  @ApiResponse({ status: 404, description: 'Sync session not found' })
  async getSessionById(@Param('id') id: string): Promise<SyncSessionDto> {
    return this.syncSessionsService.getSessionById(id);
  }

  @Get('device/:deviceId/user/:userIdentifier')
  @ApiOperation({ summary: 'Get sync sessions for a specific device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiQuery({ name: 'limit', description: 'Number of sessions to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of sessions to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sync sessions found',
    type: [SyncSessionDto]
  })
  async getSessionsByDevice(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncSessionDto[]> {
    return this.syncSessionsService.getSessionsByDevice(
      deviceId,
      userIdentifier,
      limit ? Number(limit) : 10,
      offset ? Number(offset) : 0
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get sync sessions for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', description: 'Number of sessions to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of sessions to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sync sessions found',
    type: [SyncSessionDto]
  })
  async getSessionsByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<SyncSessionDto[]> {
    return this.syncSessionsService.getSessionsByProject(
      projectId,
      limit ? Number(limit) : 10,
      offset ? Number(offset) : 0
    );
  }
}
