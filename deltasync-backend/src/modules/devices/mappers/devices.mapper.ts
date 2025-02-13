import { Injectable } from '@nestjs/common';
import { Device } from '@prisma/client';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { DeviceResponseDto } from '../dto/device-response.dto';

@Injectable()
export class DevicesMapper {
    toResponse(device: Device): DeviceResponseDto {
        return {
            deviceId: device.deviceId,
            userIdentifier: device.userIdentifier,
            lastSeenAt: device.lastSeenAt,
            createdAt: device.createdAt,
        };
    }

    mapDevices(devices: Device[]): DeviceResponseDto[] {
        return devices.map((device) => this.toResponse(device));
    }

    mapToPaginatedResponse(
        data: (Device & { _count?: { changeLogs: number } })[],
        total: number,
        page: number,
        limit: number,
    ): PaginatedResponse<DeviceResponseDto> {
        return {
            data: data.map((device) => this.toResponse(device)),
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        };
    }
}