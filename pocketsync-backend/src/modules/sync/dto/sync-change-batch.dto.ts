import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export enum ChangeType {
    INSERT = 'insert',
    UPDATE = 'update',
    DELETE = 'delete',
}

export enum ChangeDataKey {
    OLD = 'old',
    NEW = 'new'
}

export class SyncChange {
    /// The ID of the change
    @ApiProperty()
    change_id: string;

    /// The table that was changed
    @ApiProperty()
    table_name: string;

    /// The global ID of the record that was changed
    @ApiProperty()
    record_id: string;

    /// The type of operation (insert, update, delete)
    @ApiProperty({
        enum: ChangeType
    })
    operation: ChangeType;

    /// The data associated with the change
    ///
    /// For inserts, this contains only 'new' data.
    /// For updates, this contains both 'old' and 'new' data.
    /// For deletes, this contains only 'old' data.
    @ApiProperty({
        required: true,
        description: 'Change data containing old/new values',
        example: { [ChangeDataKey.OLD]: { field: 'oldValue' }, [ChangeDataKey.NEW]: { field: 'newValue' } }
    })
    data: { [key: string]: any };

    /// Timestamp when the change occurred (milliseconds since epoch)
    @ApiProperty({
        type: 'number',
        required: true
    })
    timestamp: number;

    /// Version number for the change
    @ApiProperty({
        type: 'number',
        required: true
    })
    version: number;
}

export class SyncChangeBatchDto {
    /// The changes that occurred since the last sync
    @ApiProperty({
        type: () => SyncChange,
        isArray: true,
        required: true
    })
    @ApiProperty({
        type: () => SyncChange,
        isArray: true,
        required: true
    })
    @IsNotEmpty()
    changes: SyncChange[];

    /// The timestamp of the batch
    @ApiProperty()
    @IsNumber()
    batch_timestamp: number;

    /// The number of changes in the batch
    @ApiProperty()
    @IsNumber()
    change_count: number;
}
