import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesSdkController } from './devices.sdk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DevicesController, DevicesSdkController],
  providers: [DevicesService],
})
export class DevicesModule {}