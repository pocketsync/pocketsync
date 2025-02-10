import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDatabaseDto } from './dto/create-user-database.dto';
import { UpdateUserDatabaseDto } from './dto/update-user-database.dto';

@Injectable()
export class UserDatabasesService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDatabaseDto: CreateUserDatabaseDto) {
        return this.prisma.userDatabase.create({
            data: {
                userIdentifier: createUserDatabaseDto.userIdentifier,
                data: Buffer.from(createUserDatabaseDto.data, 'base64'),
                lastSyncedAt: new Date(),
            },
            include: {
                appUser: true,
            },
        });
    }

    async findOne(userIdentifier: string) {
        const userDatabase = await this.prisma.userDatabase.findUnique({
            where: { userIdentifier },
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

    async update(userIdentifier: string, updateUserDatabaseDto: UpdateUserDatabaseDto) {
        return this.prisma.userDatabase.update({
            where: { userIdentifier },
            data: {
                data: updateUserDatabaseDto.data
                    ? Buffer.from(updateUserDatabaseDto.data, 'base64')
                    : undefined,
                lastSyncedAt: new Date(),
            },
        });
    }

    async remove(userIdentifier: string) {
        return this.prisma.userDatabase.delete({
            where: { userIdentifier },
        });
    }
}