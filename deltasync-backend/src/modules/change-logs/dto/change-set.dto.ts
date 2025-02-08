import { IsObject, IsArray, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class TableRows {
    @IsArray()
    @IsString({ each: true })
    rows: string[];
}

class TableChanges {
    [key: string]: TableRows;
}

export class ChangeSetDto {
    @IsNumber()
    timestamp: number;

    @IsNumber()
    version: number;

    @IsObject()
    @ValidateNested()
    @Type(() => TableChanges)
    insertions: TableChanges;

    @IsObject()
    @ValidateNested()
    @Type(() => TableChanges)
    updates: TableChanges;

    @IsObject()
    @ValidateNested()
    @Type(() => TableChanges)
    deletions: TableChanges;
}