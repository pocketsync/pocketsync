import { Module } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ChangeLogsController } from './change-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketGateway } from './websocket.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeLogsController],
  providers: [ChangesService, WebSocketGateway],
})
export class ChangeLogsModule {}