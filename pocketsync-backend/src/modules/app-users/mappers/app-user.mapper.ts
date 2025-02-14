import { Injectable } from '@nestjs/common';
import { AppUser, Device } from '@prisma/client';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { AppUserResponseDto } from '../dto/responses/app-users-response.dto';
import { DevicesMapper } from 'src/modules/devices/mappers/devices.mapper';

@Injectable()
export class AppUserMapper {
  constructor(private devicesMapper: DevicesMapper) { }

  toResponse(appUser: AppUser & { devices?: Device[] }): AppUserResponseDto {
    const lastSeenAt = appUser.devices?.length
      ? Math.max(...appUser.devices
        .filter(device => device.lastSeenAt)
        .map(device => device.lastSeenAt?.getTime() ?? 0)) || null
      : null;
    return {
      userIdentifier: appUser.userIdentifier,
      projectId: appUser.projectId,
      createdAt: appUser.createdAt,
      lastSeenAt: lastSeenAt ? new Date(lastSeenAt) : null,
      devices: appUser.devices ? this.devicesMapper.mapDevices(appUser.devices) : [],
    };
  }

  mapToPaginatedResponse(
    data: AppUser[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<AppUserResponseDto> {
    return {
      data: data.map((appUser) => this.toResponse(appUser)),
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}