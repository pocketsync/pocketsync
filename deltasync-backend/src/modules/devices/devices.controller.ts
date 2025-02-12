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
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(req.user.id, createDeviceDto);
  }

  @Get('app-user/:appUserId')
  findAll(
    @Request() req,
    @Param('appUserId') appUserId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.devicesService.findAll(req.user.id, appUserId, paginationQuery);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.devicesService.findOne(req.user.id, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.devicesService.remove(req.user.id, id);
  }
}