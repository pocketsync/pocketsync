import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserMapper } from './mappers/user.mapper';
import { NotificationSettingsController } from './controllers/notification-settings.controller';
import { NotificationSettingsService } from './services/notification-settings.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('oauth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('oauth.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, NotificationSettingsController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy, UserMapper, NotificationSettingsService, EmailService, EmailTemplateService],
  exports: [JwtModule, AuthService],
})
export class AuthModule { }
