import { Module } from '@nestjs/common';
import { DebugSettingsService } from './debug-settings.service';
import { DebugSettingsController } from './debug-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DebugSettingsController],
  providers: [DebugSettingsService],
  exports: [DebugSettingsService],
})
export class DebugSettingsModule {}
