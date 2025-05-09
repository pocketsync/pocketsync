import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/responses/project.response.dto';
import { OpenApiPaginationResponse } from 'src/common/dto/paginated-response.dto';
import { CreateAuthTokenDto } from './dto/create-auth-token.dto';
import { AuthTokenResponseDto } from './dto/responses/auth-token.response.dto';
import { SyncActivityDto } from './dto/responses/sync-activity.dto';
import { AppUserDto } from 'src/common/entities/app-user.entity';
  
@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new project', operationId: 'createProject' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: ProjectResponseDto })
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the authenticated user', operationId: 'getAllProjects' })
  @OpenApiPaginationResponse(ProjectResponseDto)
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.projectsService.findAll(req.user.id, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project by ID', operationId: 'getProjectById' })
  @ApiResponse({ status: 200, description: 'Project found', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project', operationId: 'updateProject' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project', operationId: 'deleteProject' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.projectsService.remove(req.user.id, id);
  }

  @Post('/:projectId/auth-tokens')
  @ApiOperation({ summary: 'Generate a new auth token for a project', operationId: 'generateAuthToken' })
  @ApiResponse({ status: 201, description: 'Auth token generated successfully', type: AuthTokenResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async generateAuthToken(@Request() req, @Param('projectId') projectId: string, @Body() createAuthTokenDto: CreateAuthTokenDto) {
    return this.projectsService.createAuthToken(req.user.id, projectId, createAuthTokenDto);
  }

  @Delete('auth-tokens/:tokenId')
  @ApiOperation({ summary: 'Revoke a project auth token', operationId: 'revokeAuthToken' })
  @ApiResponse({ status: 200, description: 'Auth token revoked successfully' })
  @ApiResponse({ status: 404, description: 'Auth token not found' })
  async revokeAuthToken(@Request() req, @Param('tokenId') tokenId: string) {
    return this.projectsService.revokeAuthToken(req.user.id, tokenId);
  }

  @Get(':projectId/sync/activity')
  @ApiOperation({ summary: 'Get sync activity for a project', operationId: 'getSyncActivity' })
  @ApiResponse({ status: 200, description: 'Sync activity found', type: SyncActivityDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getSyncActivity(@Request() req, @Param('projectId') projectId: string) {
    return this.projectsService.getSyncActivity(req.user.id, projectId);
  }

  /**
   * Get app users for a project
   * @param projectId The ID of the project
   * @param paginationQuery Pagination query
   * @returns A paginated list of app users
   */
  @Get(':projectId/app-users')
  @ApiOperation({ summary: 'Get app users for a project', operationId: 'getAppUsers' })
  @OpenApiPaginationResponse(AppUserDto)
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getAppUsers(@Request() req, @Param('projectId') projectId: string, @Query() paginationQuery: PaginationQueryDto) {
    return this.projectsService.getAppUsers(req.user.id, projectId, paginationQuery);
  }
}