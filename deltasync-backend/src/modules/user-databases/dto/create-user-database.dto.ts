import { IsNotEmpty, IsUUID, IsBase64 } from 'class-validator';

export class CreateUserDatabaseDto {
  @IsUUID()
  @IsNotEmpty()
  userIdentifier: string;

  @IsBase64()
  @IsNotEmpty()
  data: string;
}