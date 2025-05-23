import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('email');
    
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    const emailConfig = this.configService.get('email');

    try {
      const info = await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject: `PocketSync - ${subject}`,
        html,
      });

      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplatedEmail(to: string, subject: string, template: string, context: any) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    
    // Add frontend URL to all template contexts
    const enrichedContext = {
      ...context,
      frontendUrl,
    };
    
    const html = await this.emailTemplateService.render(template, enrichedContext);
    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = await this.emailTemplateService.render('password-reset', {
      resetLink,
    });

    return this.sendEmail(to, 'Reset your password', html);
  }
  
  async sendWelcomeEmail(to: string, firstName: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const dashboardUrl = `${frontendUrl}/dashboard`;

    return this.sendTemplatedEmail(
      to,
      'Welcome to PocketSync',
      'welcome',
      {
        firstName,
        dashboardUrl,
        docsUrl: 'https://docs.pocketsync.dev',
        sampleUrl: 'https://github.com/pocketsync/pocketsync-samples',
      }
    );
  }
  
  async sendAccountDeletionEmail(to: string, firstName: string) {
    return this.sendTemplatedEmail(
      to,
      'Account deleted',
      'account-deletion',
      {
        firstName: firstName || 'User',
      }
    );
  }
}