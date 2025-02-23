import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { SdkAuthGuard } from '../../common/guards/sdk-auth.guard';
import { CreateAppUserDto } from './dto/create-app-user.dto';
import { AppUserResponseDto } from './dto/responses/app-users-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('sdk/app-users')
@UseGuards(SdkAuthGuard)
export class AppUsersSdkController {
  constructor(private readonly appUsersService: AppUsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new app user', operationId: 'createAppUser' })
  @ApiResponse({ status: 201, description: 'App user created successfully', type: AppUserResponseDto })
  create(@Body() createAppUserDto: CreateAppUserDto) {
    return this.appUsersService.createFromSdk(createAppUserDto);
  }
}