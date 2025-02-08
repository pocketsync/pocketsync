import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserDatabasesService } from './user-databases.service';
import { CreateUserDatabaseDto } from './dto/create-user-database.dto';
import { UpdateUserDatabaseDto } from './dto/update-user-database.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-databases')
@UseGuards(JwtAuthGuard)
export class UserDatabasesController {
  constructor(private readonly userDatabasesService: UserDatabasesService) {}

  @Post()
  create(@Request() req, @Body() createUserDatabaseDto: CreateUserDatabaseDto) {
    return this.userDatabasesService.create(req.user.id, createUserDatabaseDto);
  }

  @Get(':appUserId')
  findOne(@Request() req, @Param('appUserId') appUserId: string) {
    return this.userDatabasesService.findOne(req.user.id, appUserId);
  }

  @Patch(':appUserId')
  update(
    @Request() req,
    @Param('appUserId') appUserId: string,
    @Body() updateUserDatabaseDto: UpdateUserDatabaseDto,
  ) {
    return this.userDatabasesService.update(req.user.id, appUserId, updateUserDatabaseDto);
  }

  @Delete(':appUserId')
  remove(@Request() req, @Param('appUserId') appUserId: string) {
    return this.userDatabasesService.remove(req.user.id, appUserId);
  }
}