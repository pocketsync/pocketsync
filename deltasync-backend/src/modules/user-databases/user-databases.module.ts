import { Module } from '@nestjs/common';
import { UserDatabasesService } from './user-databases.service';
import { UserDatabasesController } from './user-databases.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserDatabasesController],
  providers: [UserDatabasesService],
})
export class UserDatabasesModule {}