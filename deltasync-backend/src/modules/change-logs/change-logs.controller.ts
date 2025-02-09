import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { DevicesService } from '../devices/devices.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';

@Controller('sdk/changes')
@UseGuards(ApiKeyAuthGuard)
export class ChangeLogsController {
  constructor(
    private readonly changesService: ChangesService,
    private readonly devicesService: DevicesService,
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

    // Ensure device exists or create it
    let device = await this.devicesService.findByDeviceId(submission.deviceId);

    if (!device) {
      device = await this.devicesService.createFromSdk({
        deviceId: submission.deviceId,
        userIdentifier,
      });
    }

    return this.changesService.processChange(
      userIdentifier,
      device.id,
      submission.changeSet,
    );
  }
}