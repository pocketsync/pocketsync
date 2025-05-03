import { Module } from '@nestjs/common';
import { SyncLogsService } from './sync-logs.service';
import { SyncLogsController } from './sync-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyncLogsController],
  providers: [SyncLogsService],
  exports: [SyncLogsService],
})
export class SyncLogsModule {}
