import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

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
}