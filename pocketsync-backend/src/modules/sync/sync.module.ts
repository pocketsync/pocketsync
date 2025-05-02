import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { UserDeviceMiddleware } from './middlewares/user-device.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { ChangeOptimizerService } from './services/change-optimizer.service';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [PrismaModule],
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
