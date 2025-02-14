import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersModule } from '../app-users/app-users.module';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesMapper } from './mappers/devices.mapper';
import { AppUserMapper } from '../app-users/mappers/app-user.mapper';

@Module({
  imports: [PrismaModule, AppUsersModule],
  providers: [DevicesService, AppUsersService, AppUserMapper, DevicesMapper],
  exports: [DevicesService, DevicesMapper],
})
export class DevicesModule { }