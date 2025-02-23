import { IsObject, IsArray, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RowChange {
    @ApiProperty({
        description: 'Unique identifier for the row',
        example: 'user_123'
    })
    @IsString()
    primaryKey: string;

    @ApiProperty({
        description: 'Version number of the row change',
        example: 1,
        minimum: 0
    })
    @IsNumber()
    version: number;

    @ApiProperty({
        description: 'Timestamp of when the change occurred (in milliseconds since epoch)',
        example: 1645564800000
    })
    @IsNumber()
    timestamp: number;

    @ApiProperty({
        description: 'The actual data of the row',
        example: { name: 'John Doe', email: 'john@example.com' }
    })
    @IsObject()
    data: { [key: string]: any };
}

class TableRows {
    @ApiProperty({
        description: 'Array of row changes for a specific table',
        type: [RowChange]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RowChange)
    rows: RowChange[];
}

class TableChanges {
    [key: string]: TableRows;
}

export class ChangeSetDto {
    @ApiProperty({
        description: 'Timestamp when the change set was created (in milliseconds since epoch)',
        example: 1645564800000
    })
    @IsNumber()
    timestamp: number;

    @ApiProperty({
        description: 'Version number of the entire change set',
        example: 1,
        minimum: 0
    })
    @IsNumber()
    version: number;

    @ApiProperty({
        description: 'Map of table names to their inserted rows',
        type: TableChanges
    })
    @IsObject()
    @Type(() => TableChanges)
    insertions: TableChanges;

    @ApiProperty({
        description: 'Map of table names to their updated rows',
        type: TableChanges
    })
    @IsObject()
    @Type(() => TableChanges)
    updates: TableChanges;

    @ApiProperty({
        description: 'Map of table names to their deleted rows',
        type: TableChanges
    })
    @IsObject()
    @Type(() => TableChanges)
    deletions: TableChanges;
}