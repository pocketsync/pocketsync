import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { DevicesService } from '../devices/devices.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';
import { AppUsersService } from '../app-users/app-users.service';

@Controller('sdk/changes')
@UseGuards(ApiKeyAuthGuard)
export class ChangeLogsController {
  private readonly logger = new Logger(ChangeLogsController.name);

  constructor(
    private readonly changesService: ChangeLogsService,
    private readonly devicesService: DevicesService,
    private readonly appUsersService: AppUsersService,
  ) { }

  private async getOrCreateUserFromId(userId: string, projectId: string) {
    let appUser = await this.appUsersService.findByUserIdentifier(userId, projectId);
    if (!appUser) {
      appUser = await this.appUsersService.createFromSdk({
        userIdentifier: userId,
        projectId: projectId,
      });
    }

    return appUser
  }

  private async getOrCreateDeviceFromId(deviceId: string, userId: string, projectId: string) {
    let device = await this.devicesService.findByDeviceId(deviceId);
    if (!device) {
      device = await this.devicesService.createFromSdk({
        deviceId: deviceId,
        userIdentifier: userId,
        projectId: projectId,
      });
    }

    return device
  }

  @Post()
  async submitChange(
    @Headers('x-user-id') userIdentifier: string,
    @Headers('x-project-id') projectId: string,
    @Headers('x-device-id') deviceId: string,
    @Body() submission: ChangeSubmissionDto,
  ) {
    if (!userIdentifier || !deviceId) {
      throw new UnauthorizedException('User identifier and device id are required');
    }

    const appUser = await this.getOrCreateUserFromId(userIdentifier, projectId)
    const device = await this.getOrCreateDeviceFromId(deviceId, userIdentifier, projectId)

    try {
      await this.changesService.processChange(
        appUser.userIdentifier,
        device.deviceId,
        submission.changeSets,
      );
      return {
        status: 'success',
        processed: true,
        message: 'Changes processed successfully'
      };
    } catch (error) {
      this.logger.error('Error processing change', {
        error: error.message,
        userIdentifier,
        deviceId: device.deviceId,
        stack: error.stack,
      });
      throw new HttpException(
        {
          status: 'error',
          processed: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async fetchChanges(
    @Headers('x-user-id') userIdentifier: string,
    @Headers('x-device-id') deviceIdentifier: string,
    @Headers('x-project-id') projectId: string,
    @Body() data: { lastFetchedAt?: Date }
  ) {
    if (!userIdentifier || !deviceIdentifier) {
      throw new UnauthorizedException('Both user identifier and device identifier are required');
    }

    await this.getOrCreateUserFromId(userIdentifier, projectId)
    const device = await this.getOrCreateDeviceFromId(deviceIdentifier, userIdentifier, projectId)

    const changes = await this.changesService.fetchMissingChanges(device, data)

    return changes
  }
}