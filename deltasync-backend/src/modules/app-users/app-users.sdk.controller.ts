import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { CreateAppUserDto } from './dto/create-app-user.dto';

@Controller('sdk/app-users')
@UseGuards(ApiKeyAuthGuard)
export class AppUsersSdkController {
  constructor(private readonly appUsersService: AppUsersService) {}

  @Post()
  create(@Body() createAppUserDto: CreateAppUserDto) {
    return this.appUsersService.createFromSdk(createAppUserDto);
  }
}