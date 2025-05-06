import { DeviceChange } from '@prisma/client';
import { DeviceChangeDto } from '../dto/device-change-response.dto';

export class DeviceChangeMapper {
  static toDto(deviceChange: DeviceChange): DeviceChangeDto {
    return {
      id: deviceChange.id,
      changeId: deviceChange.changeId,
      projectId: deviceChange.projectId,
      userIdentifier: deviceChange.userIdentifier,
      deviceId: deviceChange.deviceId,
      changeType: deviceChange.changeType,
      tableName: deviceChange.tableName,
      recordId: deviceChange.recordId,
      data: deviceChange.data as Record<string, any>,
      clientTimestamp: deviceChange.clientTimestamp,
      clientVersion: deviceChange.clientVersion,
      createdAt: deviceChange.createdAt,
      deletedAt: deviceChange.deletedAt,
      syncSessionId: deviceChange.syncSessionId,
    };
  }

  static toDtoList(deviceChanges: DeviceChange[]): DeviceChangeDto[] {
    return deviceChanges.map(deviceChange => this.toDto(deviceChange));
  }
}
