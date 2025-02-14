import { ProjectAuthTokens } from '@prisma/client';
import { AuthTokenResponseDto } from '../dto/responses/auth-token.response.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthTokensMapper {
    mapToResponse(authTokens: ProjectAuthTokens[]): AuthTokenResponseDto[] {
        return authTokens.map(token => ({
            id: token.id,
            projectId: token.projectId,
            userId: token.userId,
            token: token.token,
            name: token.name ?? 'Default',
        }));
    }
}