import { ApiProperty } from "@nestjs/swagger";

export class Device {
    @ApiProperty({ description: 'Unique device identifier' })
    deviceId: string;

    @ApiProperty({ description: 'User identifier this device belongs to' })
    userIdentifier: string;

    @ApiProperty({ description: 'Last time the device was seen active', required: false, type: Date })
    lastSeenAt?: Date | null;

    @ApiProperty({ description: 'Last time a change was recorded from this device', required: false, type: Date })
    lastChangeAt?: Date | null;

    @ApiProperty({ description: 'When the device was first registered' })
    createdAt: Date;

    @ApiProperty({ description: 'When the device was deleted, if applicable', required: false, type: Date })
    deletedAt?: Date | null;
}
