import { Device as PrismaDevice } from "@prisma/client";
import { DeviceDto } from "src/modules/devices/dto/device.dto";

export class DeviceMapper {
    static toDevice(device: PrismaDevice): DeviceDto {
        return {
            deviceId: device.deviceId,
            userIdentifier: device.userIdentifier,
            lastSeenAt: device.lastSeenAt,
            deviceInfo: device.deviceInfo as Record<string, any> || undefined,
            lastChangeAt: device.lastChangeAt,
            createdAt: device.createdAt,
            deletedAt: device.deletedAt
        }
    }
}