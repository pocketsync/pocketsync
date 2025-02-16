import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import emailConfig from '../../config/email.config';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}