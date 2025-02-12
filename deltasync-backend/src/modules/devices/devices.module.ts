import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersModule } from '../app-users/app-users.module';
import { AppUsersService } from '../app-users/app-users.service';

@Module({
  imports: [PrismaModule, AppUsersModule],
  providers: [DevicesService, AppUsersService],
  exports: [DevicesService],
})
export class DevicesModule { }