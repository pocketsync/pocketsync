import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateOAuthLogin(profile: any, provider: string) {
    const providerId = await this.getOrCreateProvider(provider);
    let user = await this.findUserByEmail(profile.email);

    if (!user) {
      user = await this.createUser(profile);
    }

    await this.createOrUpdateSocialConnection(user.id, providerId, profile);
    const tokens = await this.generateTokens(user);
    
    return {
      user,
      ...tokens,
    };
  }

  private async getOrCreateProvider(providerName: string) {
    const provider = await this.prisma.oAuthProvider.findUnique({
      where: { name: providerName },
    });

    if (provider) return provider.id;

    const newProvider = await this.prisma.oAuthProvider.create({
      data: {
        name: providerName,
        clientId: this.configService.get(`oauth.${providerName}.clientID`)!,
        clientSecret: this.configService.get(`oauth.${providerName}.clientSecret`)!,
      },
    });

    return newProvider.id;
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  private async createUser(profile: any) {
    return this.prisma.user.create({
      data: {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        isEmailVerified: true,
      },
    });
  }

  private async createOrUpdateSocialConnection(userId: string, providerId: string, profile: any) {
    return this.prisma.userSocialConnection.upsert({
      where: {
        providerId_providerUserId: {
          providerId,
          providerUserId: profile.id,
        },
      },
      update: {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        tokenExpiresAt: profile.expiresAt,
        providerData: profile,
      },
      create: {
        userId,
        providerId,
        providerUserId: profile.id,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        tokenExpiresAt: profile.expiresAt,
        providerData: profile,
      },
    });
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };
    
    const refreshToken = uuidv4();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
    };
  }
}
