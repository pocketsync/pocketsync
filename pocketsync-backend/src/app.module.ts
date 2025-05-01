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
    EmailModule,
    PrismaModule,
    SyncModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
