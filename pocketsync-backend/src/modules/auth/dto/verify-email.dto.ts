import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}