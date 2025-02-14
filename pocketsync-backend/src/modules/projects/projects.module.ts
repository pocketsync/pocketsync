import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectMapper } from './mappers/project.mapper';
import { AuthTokensMapper } from './mappers/auth-tokens.mapper';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMapper, AuthTokensMapper],
})
export class ProjectsModule {}