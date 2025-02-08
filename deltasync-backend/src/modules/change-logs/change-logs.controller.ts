import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';

@Controller('sdk/changes')
@UseGuards(ApiKeyAuthGuard)
export class ChangeLogsController {
  constructor(private readonly changesService: ChangesService) {}

  @Post()
  async submitChange(@Body() submission: ChangeSubmissionDto) {
    return this.changesService.processChange(
      submission.appUserId,
      submission.deviceId,
      submission.changeSet,
    );
  }
}