import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { DevicesService } from '../devices/devices.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';
import { AppUsersService } from '../app-users/app-users.service';

@Controller('sdk/changes')
@UseGuards(ApiKeyAuthGuard)
export class ChangeLogsController {
  constructor(
    private readonly changesService: ChangeLogsService,
    private readonly devicesService: DevicesService,
    private readonly appUsersService: AppUsersService,
  ) { }

  @Post()
  async submitChange(
    @Headers('x-user-identifier') userIdentifier: string,
    @Headers('x-project-id') projectId: string,
    @Body() submission: ChangeSubmissionDto,
  ) {
    if (!userIdentifier) {
      throw new UnauthorizedException('User identifier is required');
    }

    // Ensure app user exists or create it
    let appUser = await this.appUsersService.findByUserIdentifier(userIdentifier, projectId);

    if (!appUser) {
      appUser = await this.appUsersService.createFromSdk({
        userIdentifier,
        projectId: projectId,
      });
    }

    // Ensure device exists or create it
    let device = await this.devicesService.findByDeviceId(submission.deviceId);

    if (!device) {
      device = await this.devicesService.createFromSdk({
        deviceId: submission.deviceId,
        userIdentifier: appUser.userIdentifier,
        projectId: projectId,
      });
    }

    return this.changesService.processChange(
      appUser.id,
      device.id,
      projectId,
      submission.changeSet,
    );
  }
}