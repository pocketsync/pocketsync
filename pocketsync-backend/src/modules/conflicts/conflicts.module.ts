import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConflictsService } from './conflicts.service';
import { ConflictsController } from './conflicts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncLogsModule } from '../sync-logs/sync-logs.module';
import { UserDeviceMiddleware } from '../sync/middlewares/user-device.middleware';

@Module({
  imports: [PrismaModule, SyncLogsModule],
  controllers: [ConflictsController],
  providers: [ConflictsService],
  exports: [ConflictsService],
})
export class ConflictsModule {
    configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(UserDeviceMiddleware)
        .forRoutes(
          { path: 'conflicts/report', method: RequestMethod.POST }
        );
    }
}
