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
  Query,
} from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { CreateAppUserDto } from './dto/create-app-user.dto';
import { UpdateAppUserDto } from './dto/update-app-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('app-users')
@UseGuards(JwtAuthGuard)
export class AppUsersController {
  constructor(private readonly appUsersService: AppUsersService) {}

  @Get('project/:projectId')
  findAll(
    @Request() req,
    @Param('projectId') projectId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.appUsersService.findAll(req.user.id, projectId, paginationQuery);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.appUsersService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAppUserDto: UpdateAppUserDto,
  ) {
    return this.appUsersService.update(req.user.id, id, updateAppUserDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.appUsersService.remove(req.user.id, id);
  }
}