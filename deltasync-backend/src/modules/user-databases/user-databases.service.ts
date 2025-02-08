import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDatabaseDto } from './dto/create-user-database.dto';
import { UpdateUserDatabaseDto } from './dto/update-user-database.dto';

@Injectable()
export class UserDatabasesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createUserDatabaseDto: CreateUserDatabaseDto) {
        await this.validateAppUserAccess(userId, createUserDatabaseDto.appUserId);

        return this.prisma.userDatabase.create({
            data: {
                appUserId: createUserDatabaseDto.appUserId,
                data: Buffer.from(createUserDatabaseDto.data, 'base64'),
                lastSyncedAt: new Date(),
            },
            include: {
                appUser: true,
            },
        });
    }

    async findOne(userId: string, appUserId: string) {
        await this.validateAppUserAccess(userId, appUserId);

        const userDatabase = await this.prisma.userDatabase.findUnique({
            where: { appUserId },
            include: {
                appUser: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!userDatabase) {
            throw new NotFoundException('User database not found');
        }

        return userDatabase
    }

    async update(userId: string, appUserId: string, updateUserDatabaseDto: UpdateUserDatabaseDto) {
        await this.validateAppUserAccess(userId, appUserId);

        return this.prisma.userDatabase.update({
            where: { appUserId },
            data: {
                data: updateUserDatabaseDto.data
                    ? Buffer.from(updateUserDatabaseDto.data, 'base64')
                    : undefined,
                lastSyncedAt: new Date(),
            },
        });
    }

    async remove(userId: string, appUserId: string) {
        await this.validateAppUserAccess(userId, appUserId);

        return this.prisma.userDatabase.delete({
            where: { appUserId },
        });
    }

    private async validateAppUserAccess(userId: string, appUserId: string) {
        const appUser = await this.prisma.appUser.findUnique({
            where: { id: appUserId },
            include: { project: true },
        });

        if (!appUser) {
            throw new NotFoundException('App user not found');
        }

        if (appUser.project.userId !== userId) {
            throw new ForbiddenException('Access denied to this app user');
        }
    }
}