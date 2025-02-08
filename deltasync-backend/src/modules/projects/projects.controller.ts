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

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.projectsService.findAll(req.user.id, paginationQuery);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.projectsService.remove(req.user.id, id);
  }

  @Post(':id/regenerate-api-key')
  regenerateApiKey(@Request() req, @Param('id') id: string) {
    return this.projectsService.regenerateApiKey(req.user.id, id);
  }
}