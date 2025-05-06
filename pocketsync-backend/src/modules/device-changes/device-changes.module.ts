import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DeviceChangesController } from './device-changes.controller';
import { DeviceChangesService } from './device-changes.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceChangesController],
  providers: [DeviceChangesService],
  exports: [DeviceChangesService],
})
export class DeviceChangesModule {}
