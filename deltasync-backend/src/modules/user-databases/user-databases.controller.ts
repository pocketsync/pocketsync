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
  constructor(private readonly userDatabasesService: UserDatabasesService) { }
}