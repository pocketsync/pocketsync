import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class SdkAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const projectId = request.headers['x-project-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    if (!projectId) {
      throw new UnauthorizedException('Project ID is required');
    }

    const token = authHeader.split(' ')[1];
    const authToken = await this.prisma.projectAuthTokens.findFirst({
      where: {
        AND: [
          { token },
          { projectId }
        ]
      },
      include: {
        project: true
      }
    });

    if (!authToken) {
      throw new UnauthorizedException('Invalid token or project ID');
    }

    request.project = authToken.project;
    request.user = { id: authToken.userId };
    return true;
  }
}