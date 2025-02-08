import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { oauthConfig } from './config/oauth.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [oauthConfig],
    }),
    AuthModule,
    ProjectsModule,
  ],
})
export class AppModule { }
