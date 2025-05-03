import { Module } from '@nestjs/common';
import { SyncMetricsService } from './sync-metrics.service';
import { SyncMetricsController } from './sync-metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyncMetricsController],
  providers: [SyncMetricsService],
  exports: [SyncMetricsService],
})
export class SyncMetricsModule {}
