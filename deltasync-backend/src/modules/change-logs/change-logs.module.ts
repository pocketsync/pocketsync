import { Module } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { ChangeLogsController } from './change-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesService } from '../devices/devices.service';
import { ChangesGateway } from './changes.gateway';
import { AppUserMapper } from '../app-users/mappers/app-user.mapper';
import { DevicesMapper } from '../devices/mappers/devices.mapper';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeLogsController],
  providers: [
    ChangeLogsService,
    AppUsersService,
    DevicesService,
    ChangesGateway,
    AppUserMapper,
    DevicesMapper,
  ],
})
export class ChangeLogsModule { }