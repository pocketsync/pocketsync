import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { SdkAuthGuard } from '../../common/guards/sdk-auth.guard';
import { CreateAppUserDto } from './dto/create-app-user.dto';

@Controller('sdk/app-users')
@UseGuards(SdkAuthGuard)
export class AppUsersSdkController {
  constructor(private readonly appUsersService: AppUsersService) {}

  @Post()
  create(@Body() createAppUserDto: CreateAppUserDto) {
    return this.appUsersService.createFromSdk(createAppUserDto);
  }
}