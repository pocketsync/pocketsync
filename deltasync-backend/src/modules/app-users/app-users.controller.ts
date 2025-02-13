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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OpenApiPaginationResponse, PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { AppUserResponseDto } from './dto/responses/app-users-response.dto';

@Controller('app-users')
@UseGuards(JwtAuthGuard)
export class AppUsersController {
  constructor(private readonly appUsersService: AppUsersService) { }

  @Get('project/:projectId')
  @OpenApiPaginationResponse(AppUserResponseDto)
  @ApiOperation({ summary: 'Find all app users', operationId: 'projectUsers' })
  findAll(
    @Request() req,
    @Param('projectId') projectId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.appUsersService.findAll(req.user.id, projectId, paginationQuery);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'The found record',
  })
  @ApiOperation({ summary: 'Delete app user', operationId: 'deleteAppUser' })
  remove(@Request() req, @Param('id') id: string) {
    return this.appUsersService.remove(req.user.id, id);
  }
}