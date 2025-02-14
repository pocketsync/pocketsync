import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'The new JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'The new refresh token',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  refreshToken: string;
}