import { IsObject, IsArray, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class TableSchema {
    @IsNumber()
    version: number;

    @IsString()
    hash: string;
}

class TableRows {
    @IsNumber()
    schemaVersion: number;

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
    @Type(() => TableSchema)
    schemas: { [tableName: string]: TableSchema };

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