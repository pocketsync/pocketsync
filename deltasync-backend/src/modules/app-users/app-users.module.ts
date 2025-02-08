import { Module } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import { AppUsersController } from './app-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppUsersSdkController } from './app-users.sdk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AppUsersController, AppUsersSdkController],
  providers: [AppUsersService],
})
export class AppUsersModule {}