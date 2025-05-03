import { Module } from '@nestjs/common';
import { ConflictsService } from './conflicts.service';
import { ConflictsController } from './conflicts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncLogsModule } from '../sync-logs/sync-logs.module';

@Module({
  imports: [PrismaModule, SyncLogsModule],
  controllers: [ConflictsController],
  providers: [ConflictsService],
  exports: [ConflictsService],
})
export class ConflictsModule {}
