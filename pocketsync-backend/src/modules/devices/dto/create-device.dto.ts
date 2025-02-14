import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsUUID()
  @IsNotEmpty()
  userIdentifier: string;
}