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
    @Type(() => TableChanges)
    insertions: TableChanges;

    @IsObject()
    @Type(() => TableChanges)
    updates: TableChanges;

    @IsObject()
    @Type(() => TableChanges)
    deletions: TableChanges;
}