import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAuthTokenDto {
  @ApiProperty({
    description: 'The name of the auth token',
    example: 'Production API Key'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}