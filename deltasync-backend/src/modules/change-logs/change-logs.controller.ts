import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';

@Controller('sdk/changes')
@UseGuards(ApiKeyAuthGuard)
export class ChangeLogsController {
  constructor(private readonly changesService: ChangesService) { }

  @Post()
  async submitChange(
    @Headers('x-user-identifier') userIdentifier: string,
    @Body() submission: ChangeSubmissionDto,
  ) {
    if (!userIdentifier) {
      throw new UnauthorizedException('User identifier is required');
    }

    return this.changesService.processChange(
      userIdentifier,
      submission.deviceId,
      submission.changeSet,
    );
  }
}