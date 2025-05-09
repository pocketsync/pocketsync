import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { AppUserDto } from 'src/common/entities/app-user.entity';
import { DeviceDto } from 'src/modules/devices/dto/device.dto';
import { AppUsersMapper } from 'src/common/mappers/app-users.mapper';
import { DeviceMapper } from 'src/common/mappers/device.mapper';

// Extend the Express Request interface
interface RequestWithUserDevice extends Request {
  appUser?: AppUserDto;
  device?: DeviceDto;
  project?: { id: string };
}

@Injectable()
export class UserDeviceMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) { }

  async use(req: RequestWithUserDevice, res: Response, next: NextFunction) {
    const userIdentifier = req.headers['x-user-id'] as string;
    const deviceId = req.headers['x-device-id'] as string;
    const projectId = req.project?.id || req.headers['x-project-id'] as string;

    if (!userIdentifier || !deviceId || !projectId) {
      return next();
    }

    try {
      // Find or create the app user
      let prismaAppUser = await this.prisma.appUser.findUnique({
        where: {
          userIdentifier_projectId: {
            userIdentifier,
            projectId,
          },
        },
        include: {
          devices: true,
        },
      });

      if (!prismaAppUser) {
        prismaAppUser = await this.prisma.appUser.create({
          data: {
            userIdentifier,
            projectId,
          },
          include: {
            devices: true,
          },
        });
      }

      let prismaDevice = prismaAppUser.devices.find(d => d.deviceId === deviceId);

      if (!prismaDevice) {
        prismaDevice = await this.prisma.device.create({
          data: {
            deviceId,
            userIdentifier,
            projectId,
            lastSeenAt: new Date(),
          },
        });
      } else {
        prismaDevice = await this.prisma.device.update({
          where: {
            deviceId_userIdentifier_projectId: {
              deviceId,
              userIdentifier,
              projectId,
            },
          },
          data: {
            lastSeenAt: new Date(),
          },
        });
      }

      const appUser = AppUsersMapper.toAppUser(prismaAppUser, prismaAppUser.devices, projectId);
      const device = DeviceMapper.toDevice(prismaDevice);

      req.appUser = appUser;
      req.device = device;
    } catch (error) {
      console.error('Error in UserDeviceMiddleware:', error);
    }

    next();
  }
}
