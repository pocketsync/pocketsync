import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from 'src/common/entities/app-user.entity';
import { Device } from 'src/common/entities/device.entity';

export interface IUserDevice {
  appUser: AppUser;
  device: Device;
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
    };
  },
);
