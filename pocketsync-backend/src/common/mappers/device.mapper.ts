import { Device as PrismaDevice } from "@prisma/client";
import { Device } from "../entities/device.entity";

export class DeviceMapper {
    static toDevice(device: PrismaDevice): Device {
        return {
            deviceId: device.deviceId,
            userIdentifier: device.userIdentifier,
            lastSeenAt: device.lastSeenAt,
            lastChangeAt: device.lastChangeAt,
            createdAt: device.createdAt,
            deletedAt: device.deletedAt
        }
    }
}