import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChangeSetDto } from './change-set.dto';

export class ChangeSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;

  @ValidateNested()
  @Type(() => ChangeSetDto)
  @IsNotEmpty()
  changeSet: ChangeSetDto;
}