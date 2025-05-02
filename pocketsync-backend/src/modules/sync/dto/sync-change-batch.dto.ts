import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, Min, ValidateNested } from "class-validator";

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
    @IsNumber()
    id: number;

    /// The table that was changed
    @ApiProperty()
    @IsString()
    tableName: string;

    /// The global ID of the record that was changed
    @ApiProperty()
    @IsString()
    recordId: string;

    /// The type of operation (insert, update, delete)
    @ApiProperty({
        enum: ChangeType
    })
    @IsString()
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
    @IsNumber()
    timestamp: number;

    /// Version number for the change
    @ApiProperty({
        type: 'number',
        required: true
    })
    @IsNumber()
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
    @Type(() => SyncChange)
    @ValidateNested({ each: true })
    @IsArray()
    changes: SyncChange[];

    /// The timestamp of the batch
    @ApiProperty()
    @IsNumber()
    batch_timestamp: number;

    /// The number of changes in the batch
    @ApiProperty()
    @IsNumber()
    @Min(1)
    change_count: number;

    /// The user ID of the device
    @ApiProperty()
    @IsString()
    userId: string;

    /// The device ID of the device
    @ApiProperty()
    @IsString()
    deviceId: string;
}
