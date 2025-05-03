import { Module } from '@nestjs/common';
import { SyncSessionsService } from './sync-sessions.service';
import { SyncSessionsController } from './sync-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyncSessionsController],
  providers: [SyncSessionsService],
  exports: [SyncSessionsService],
})
export class SyncSessionsModule {}
