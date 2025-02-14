import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAuthTokenDto {
  @ApiProperty({
    description: 'The ID of the project to generate an auth token for',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'The name of the auth token',
    example: 'Production API Key'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}