import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { oauthConfig } from './config/oauth.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AppUsersModule } from './modules/app-users/app-users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ChangeLogsModule } from './modules/change-logs/change-logs.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [oauthConfig],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 60000,
          limit: 100,
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: 200,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 500,
        },
      ],
    }),
    AuthModule,
    ProjectsModule,
    AppUsersModule,
    DevicesModule,
    ChangeLogsModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
