import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectMapper } from './mappers/project.mapper';
import { AuthTokensMapper } from './mappers/auth-tokens.mapper';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMapper, AuthTokensMapper],
})
export class ProjectsModule {}