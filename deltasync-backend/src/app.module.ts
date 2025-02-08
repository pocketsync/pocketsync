import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { oauthConfig } from './config/oauth.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AppUsersModule } from './modules/app-users/app-users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ChangeLogController } from './modules/change-log/change-log.controller';
import { ChangeLogService } from './modules/change-log/change-log.service';
import { ChangeLogModule } from './modules/change-log/change-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [oauthConfig],
    }),
    AuthModule,
    ProjectsModule,
    AppUsersModule,
    DevicesModule,
    ChangeLogModule,
  ],
  controllers: [ChangeLogController],
  providers: [ChangeLogService],
})
export class AppModule {}
