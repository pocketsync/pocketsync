import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import emailConfig from '../../config/email.config';
import { EmailTemplateService } from './email-template.service';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}