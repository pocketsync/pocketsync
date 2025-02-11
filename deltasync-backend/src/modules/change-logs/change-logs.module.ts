import { Module } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { ChangeLogsController } from './change-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersService } from '../app-users/app-users.service';
import { DevicesService } from '../devices/devices.service';
import { DatabaseStateManager } from './database-state';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeLogsController],
  providers: [
    ChangeLogsService,
    AppUsersService,
    DevicesService,
    DatabaseStateManager,
  ],
})
export class ChangeLogsModule { }