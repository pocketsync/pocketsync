import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password (required for password-based accounts)',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}
