import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(SocketAuthGuard.name);

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const authHeader = client.handshake.headers.authorization;

      if (!authHeader) {
        this.logger.warn('WebSocket connection rejected: No authorization header');
        throw new WsException('Unauthorized');
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer') {
        this.logger.warn('WebSocket connection rejected: Invalid authorization type');
        throw new WsException('Invalid authorization type');
      }

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        throw new WsException('No token provided');
      }

      const projectId = client.handshake.query.project_id;
      if (!projectId) {
        this.logger.warn('WebSocket connection rejected: No project ID provided');
        throw new WsException('Project ID is required');
      }

      const authToken = await this.prisma.projectAuthTokens.findFirst({
        where: {
          AND: [
            { token },
            { projectId }
          ]
        }
      });

      if (!authToken) {
        this.logger.warn('WebSocket connection rejected: Invalid token or project ID');
        throw new WsException('Invalid token or project ID');
      }

      return true;
    } catch (error) {
      throw new WsException(error.message);
    }
  }
}