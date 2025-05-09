import { AppUserDto } from "../entities/app-user.entity";
import { AppUser as PrismaAppUser } from "@prisma/client"
import { PaginatedResponse } from "../dto/paginated-response.dto";
import { DeviceMapper } from "./device.mapper";
import { Device as PrismaDevice } from "@prisma/client";

export class AppUsersMapper {
    static toAppUser(appUser: PrismaAppUser, devices: PrismaDevice[], projectId: string): AppUserDto {
        return {
            userIdentifier: appUser.userIdentifier,
            projectId: projectId,
            createdAt: appUser.createdAt,
            deletedAt: appUser.deletedAt,
            devices: devices.map(DeviceMapper.toDevice)
        }
    }

    static mapToPaginatedResponse(data: (PrismaAppUser & { devices: PrismaDevice[] })[], total: number, page: number, limit: number): PaginatedResponse<AppUserDto> {
        return {
            data: data.map(appUser => this.toAppUser(appUser, appUser.devices, appUser.projectId)),
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        }
    }
}
