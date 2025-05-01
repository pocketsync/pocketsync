import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedResponseDto } from './dto/responses/authenticated.response.dto';
import { ConfigService } from '@nestjs/config';
import { UserMapper } from './mappers/user.mapper';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token.response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userMapper: UserMapper,
    private emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthenticatedResponseDto> {
    const existingUser = await this.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        isEmailVerified: false,
      },
    });

    // Generate email verification token
    const verificationToken = uuidv4();
    await this.prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: add(new Date(), { hours: 24 }),
      },
    });

    // Send verification email
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${verificationToken}`;
    await this.emailService.sendTemplatedEmail(
      user.email!,
      'Verify your email address',
      'email-verification',
      { firstName: user.firstName, verificationUrl }
    );

    const tokens = await this.generateTokens(user.id, user.email!);
    return {
      user: this.userMapper.toResponse(user),
      ...tokens,
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const token = uuidv4();
    const expiresAt = add(new Date(), { hours: 24 });

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Optionally invalidate all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revoked: true },
    });
  }

  async login(loginDto: LoginDto): Promise<AuthenticatedResponseDto> {
    const user = await this.findUserByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email!);
    return {
      user: this.userMapper.toResponse(user),
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

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

  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
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
    } else if (!user.isEmailVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true }
      });
    }

    await this.createOrUpdateSocialConnection(user.id, providerId, profile);
    const tokens = await this.generateTokens(user.id, user.email!);

    return {
      user: this.userMapper.toResponse(user),
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

    if (profile.avatarUrl) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: profile.avatarUrl }
      });
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
    const { accessToken, refreshToken, ...safeProfile } = profile;
    return safeProfile;
  }

  async getCurrentUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.userMapper.toResponse(user);
  }

  async changePassword(userId: string, currentPassword: string | null, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return true;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName
      },
    });

    return this.userMapper.toResponse(updatedUser);
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.used || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
    ]);
  }

  async resendEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Invalidate existing unused tokens
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });

    // Generate new verification token
    const verificationToken = uuidv4();
    await this.prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: add(new Date(), { hours: 24 }),
      },
    });

    // Send verification email
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${verificationToken}`;
    await this.emailService.sendTemplatedEmail(
      user.email!,
      'Verify your email address',
      'email-verification',
      { firstName: user.firstName, verificationUrl }
    );
  }
}
