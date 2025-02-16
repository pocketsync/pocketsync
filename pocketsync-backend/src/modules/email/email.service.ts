import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
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
        subject,
        html,
      });

      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplatedEmail(to: string, subject: string, template: string, context: any) {
    // TODO: Implement template rendering logic
    const html = template; // Replace with actual template rendering
    return this.sendEmail(to, subject, html);
  }
}