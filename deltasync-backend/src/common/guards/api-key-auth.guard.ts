import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const projectId = request.headers['x-project-id'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (!projectId) {
      throw new UnauthorizedException('Project ID is required');
    }

    const project = await this.prisma.project.findFirst({
      where: {
        AND: [
          { apiKey },
          { id: projectId }
        ]
      },
    });

    if (!project) {
      throw new UnauthorizedException('Invalid API key or project ID');
    }

    request.project = project;
    return true;
  }
}