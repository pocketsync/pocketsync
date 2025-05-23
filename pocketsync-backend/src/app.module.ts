import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { oauthConfig } from './config/oauth.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EmailModule } from './modules/email/email.module';
import { SyncModule } from './modules/sync/sync.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { DataExportsModule } from './modules/data-exports/data-exports.module';
import { ConflictsModule } from './modules/conflicts/conflicts.module';
import { DeviceChangesModule } from './modules/device-changes/device-changes.module';
import { RedisModule } from './common/services/redis.module';

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
    RedisModule,
    AuthModule,
    ProjectsModule,
    EmailModule,
    PrismaModule,
    SyncModule,
    DataExportsModule,
    ConflictsModule,
    DeviceChangesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
