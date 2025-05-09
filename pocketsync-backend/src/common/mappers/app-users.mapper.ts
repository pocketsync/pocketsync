import { AppUser } from "../entities/app-user.entity";
import { AppUser as PrismaAppUser } from "@prisma/client"

export class AppUsersMapper {
    static toAppUser(appUser: PrismaAppUser, projectId: string): AppUser {
        return {
            userIdentifier: appUser.userIdentifier,
            projectId: projectId,
            createdAt: appUser.createdAt,
            deletedAt: appUser.deletedAt
        }
    }
}
