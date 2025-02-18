import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
    type: 'string',
  })
  firstName?: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
    type: 'string',
  })
  lastName?: string | null;

  @ApiProperty({
    description: 'URL of the user\'s avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
    type: 'string',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Whether the user\'s email is verified',
    example: false
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Timestamp of when the user was created',
    example: '2024-02-13T19:14:53.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the user was last updated',
    example: '2024-02-13T19:14:53.000Z'
  })
  updatedAt: Date;
}