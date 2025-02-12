import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email!,
    );

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  async validateOAuthLogin(profile: any, provider: string) {
    const providerId = await this.getOrCreateProvider(provider);
    let user = await this.findUserByEmail(profile.email);

    if (!user) {
      user = await this.createUser(profile);
    }

    await this.createOrUpdateSocialConnection(user.id, providerId, profile);
    const tokens = await this.generateTokens(user.id, user.email!);

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
    if (!profile.accessToken) {
      throw new UnauthorizedException('No access token provided by OAuth provider');
    }

    if (!profile.id) {
      throw new UnauthorizedException('No provider user ID in OAuth profile');
    }

    try {
      const existingConnection = await this.prisma.userSocialConnection.findFirst({
        where: {
          AND: [
            { providerId },
            { providerUserId: profile.id }
          ]
        }
      });

      const connectionData = {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken || null,
        tokenExpiresAt: profile.expiresAt ? new Date(profile.expiresAt) : null,
        providerData: this.sanitizeProviderData(profile),
      };

      if (existingConnection) {
        return this.prisma.userSocialConnection.update({
          where: { id: existingConnection.id },
          data: connectionData,
        });
      }

      return this.prisma.userSocialConnection.create({
        data: {
          ...connectionData,
          userId,
          providerId,
          providerUserId: profile.id.toString(),
        },
      });
    } catch (error) {
      console.error('Social connection error:', error);
      throw new UnauthorizedException('Failed to process OAuth authentication');
    }
  }

  private sanitizeProviderData(profile: any) {
    // Remove sensitive data and ensure the object is JSON-serializable
    const { accessToken, refreshToken, ...safeProfile } = profile;
    return safeProfile;
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
