import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User\'s first name',
    example: 'John',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    description: 'User\'s last name',
    example: 'Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;
}