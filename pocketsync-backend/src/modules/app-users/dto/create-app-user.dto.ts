import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppUserDto {
  @ApiProperty({
    description: 'The unique identifier for the user',
    example: 'user123'
  })
  @IsString()
  @IsNotEmpty()
  userIdentifier: string;

  @ApiProperty({
    description: 'The UUID of the project',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}