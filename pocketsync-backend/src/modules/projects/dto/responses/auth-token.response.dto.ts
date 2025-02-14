import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the auth token',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the project this token belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  projectId: string;

  @ApiProperty({
    description: 'The ID of the user who created this token',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    description: 'The name of the auth token',
    example: 'Production API Key'
  })
  name: string;

  @ApiProperty({
    description: 'The auth token itself',
    example: 'sk_1234567890abcdefghijklmnopqrstuvwxyz'
  })
  token: string;

  @ApiProperty({
    description: 'The timestamp when the auth token was created',
    example: '2023-02-15T12:34:56.789Z'
  })
  createdAt: Date;
}