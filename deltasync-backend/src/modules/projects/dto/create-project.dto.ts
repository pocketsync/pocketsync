import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}