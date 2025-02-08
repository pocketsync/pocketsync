import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    PassportModule,
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
  providers: [JwtStrategy, GoogleStrategy, GithubStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
