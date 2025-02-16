import { User } from '@prisma/client';
import { UserResponseDto } from '../dto/responses/user.response.dto';

export class UserMapper {
    toResponse(user: User): UserResponseDto {
        console.log(user.isEmailVerified);
        return {
            id: user.id,
            email: user.email!,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }
}