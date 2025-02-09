import { IsObject, IsArray, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class RowChange {
    @IsString()
    row_id: string;

    [key: string]: any;
}

class TableRows {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RowChange)
    rows: RowChange[];
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