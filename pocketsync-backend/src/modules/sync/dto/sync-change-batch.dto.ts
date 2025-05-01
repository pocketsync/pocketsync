import { ApiProperty } from "@nestjs/swagger";

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
    id: number;

    /// The table that was changed
    @ApiProperty()
    tableName: string;

    /// The global ID of the record that was changed
    @ApiProperty()
    recordId: string;

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
        type: Map,
        required: true
    })
    data: Map<ChangeDataKey, any>;

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

    /// Whether the change has been synced to the server
    @ApiProperty()
    synced: boolean;
}
export class SyncChangeBatchDto {
    /// The changes that occurred since the last sync
    @ApiProperty({
        type: () => SyncChange,
        isArray: true,
        required: true
    })
    changes: SyncChange[];

    /// The timestamp of the batch
    @ApiProperty()
    batch_timestamp: number;

    /// The number of changes in the batch
    @ApiProperty()
    change_count: number;

    /// The user ID of the device
    @ApiProperty()
    userId: string;

    /// The device ID of the device
    @ApiProperty()
    deviceId: string;
}
