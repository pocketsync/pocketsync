import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChangeSetDto } from './change-set.dto';

export class ChangeSubmissionDto {
  @ValidateNested({ each: true })
  @Type(() => ChangeSetDto)
  @IsNotEmpty()
  @IsArray()
  changeSets: ChangeSetDto[];
}