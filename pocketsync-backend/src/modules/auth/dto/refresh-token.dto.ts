import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token to exchange for a new access token',
    example: 'a8e2f9b1-c6d4-4e5f-a3b2-1c7d9e8f6a0b'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}