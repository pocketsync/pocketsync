import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesSdkController } from './devices.sdk.controller';
import { AppUsersModule } from '../app-users/app-users.module';

@Module({
  imports: [PrismaModule, AppUsersModule],
  controllers: [DevicesController, DevicesSdkController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}