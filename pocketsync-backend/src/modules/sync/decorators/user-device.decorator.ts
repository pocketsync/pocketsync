import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUserDto } from 'src/common/entities/app-user.entity';
import { DeviceDto } from 'src/modules/devices/dto/device.dto';

export interface IUserDevice {
  appUser: AppUserDto;
  device: DeviceDto;
  projectId: string;
}

export const UserDevice = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUserDevice => {
    const request = ctx.switchToHttp().getRequest();
    
    // Ensure both appUser and device exist on the request
    if (!request.appUser || !request.device) {
      throw new Error('AppUser or Device not found in request. Make sure UserDeviceMiddleware is applied.');
    }
    
    return {
      appUser: request.appUser,
      device: request.device,
      projectId: request.headers['x-project-id'],
    };
  },
);
