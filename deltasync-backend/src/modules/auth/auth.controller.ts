import { Controller, Get, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateOAuthLogin(req.user, 'google');
    return this.handleAuthCallback(res, result);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
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