import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ChangeLogsService } from './change-logs.service';
import { ChangeLogsController } from './change-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesService } from '../devices/devices.service';
import { ChangesGateway } from './changes.gateway';
import { AppUserMapper } from '../app-users/mappers/app-user.mapper';
import { DevicesMapper } from '../devices/mappers/devices.mapper';
import { BatchProcessorService } from './services/batch-processor.service';
import { ChangeMergerService } from './services/change-merger.service';
import { DeviceValidatorService } from './services/device-validator.service';
import { ChangeStatsService } from './services/change-stats.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes
    }),
  ],
  controllers: [ChangeLogsController],
  providers: [
    ChangeLogsService,
    AppUsersService,
    DevicesService,
    ChangesGateway,
    AppUserMapper,
    DevicesMapper,
    BatchProcessorService,
    ChangeMergerService,
    DeviceValidatorService,
    ChangeStatsService,
  ],
})
export class ChangeLogsModule { }