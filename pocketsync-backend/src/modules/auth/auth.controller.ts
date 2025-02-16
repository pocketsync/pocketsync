import { Controller, Get, Post, UseGuards, Req, Res, Body, HttpStatus, Request, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedResponseDto } from './dto/responses/authenticated.response.dto';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token.response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from './dto/responses/user.response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) { }

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Register a new user with email and password',
    operationId: 'registerUser'
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthenticatedResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists'
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Login with email and password',
    operationId: 'loginUser',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthenticatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects the user to Google login page for authentication',
    operationId: 'initiateGoogleAuth'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen'
  })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles the callback from Google OAuth and creates/updates user',
    operationId: 'handleGoogleAuthCallback'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access and refresh tokens'
  })
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateOAuthLogin(req.user, 'google');
    return this.handleAuthCallback(res, result);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Initiate GitHub OAuth flow',
    description: 'Redirects the user to GitHub login page for authentication',
    operationId: 'initiateGithubAuth'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub OAuth consent screen'
  })
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth callback',
    description: 'Handles the callback from GitHub OAuth and creates/updates user',
    operationId: 'handleGithubAuthCallback'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with access and refresh tokens'
  })
  @ApiExcludeEndpoint()
  async githubAuthCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateOAuthLogin(req.user, 'github');
    return this.handleAuthCallback(res, result);
  }

  private handleAuthCallback(res: any, result: any) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const queryParams = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      `${frontendUrl}/auth/callback?${queryParams.toString()}`
    );
  }

  @Post('token/refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
    operationId: 'refreshToken',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully',
    type: RefreshTokenResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token'
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change user password with current password verification',
    operationId: 'changePassword'
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect'
  })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
    return { message: 'Password changed successfully' };
  }


  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the currently authenticated user\'s information',
    operationId: 'getCurrentUser'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getCurrentUser(@Req() req) {
    return this.authService.getCurrentUser({ sub: req.user.id });
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user\'s profile information',
    operationId: 'updateProfile'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Request a password reset email',
    operationId: 'requestPasswordReset'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully'
  })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(requestPasswordResetDto.email);
    return { message: 'Password reset email sent successfully' };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using a valid reset token',
    operationId: 'resetPassword'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token'
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email address using the verification token',
    operationId: 'verifyEmail'
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token'
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto.token);
    return { message: 'Email verified successfully' };
  }
}