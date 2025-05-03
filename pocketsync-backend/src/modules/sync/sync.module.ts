import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { UserDeviceMiddleware } from './middlewares/user-device.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { ChangeOptimizerService } from './services/change-optimizer.service';
import { SyncGateway } from './sync.gateway';
import { SyncSessionsModule } from '../sync-sessions/sync-sessions.module';
import { SyncLogsModule } from '../sync-logs/sync-logs.module';
import { SyncMetricsModule } from '../sync-metrics/sync-metrics.module';
import { DebugSettingsModule } from '../debug-settings/debug-settings.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [PrismaModule, SyncSessionsModule, SyncLogsModule, SyncMetricsModule, DebugSettingsModule, DevicesModule],
  controllers: [SyncController],
  providers: [SyncService, ChangeOptimizerService, SyncGateway],
})
export class SyncModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserDeviceMiddleware)
      .forRoutes(
        { path: 'sync/upload', method: RequestMethod.POST },
        { path: 'sync/download', method: RequestMethod.GET }
      );
  }
}
