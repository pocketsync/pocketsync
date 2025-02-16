import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class NotificationSettingsDto {
  @ApiProperty({
    description: 'Whether marketing notifications are enabled',
    example: true
  })
  @IsBoolean()
  marketingEnabled: boolean;

  @ApiProperty({
    description: 'Whether email notifications are enabled',
    example: true
  })
  @IsBoolean()
  emailEnabled: boolean;
}