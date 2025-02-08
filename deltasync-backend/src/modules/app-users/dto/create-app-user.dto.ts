import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAppUserDto {
  @IsString()
  @IsNotEmpty()
  userIdentifier: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}