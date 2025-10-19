import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { CursorQueryDto } from './dto/cursor-query.dto';
import { BulkUpsertDto } from './dto/bulk-upsert.dto';
import { SoftDeleteDto } from './dto/soft-delete.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('test')
  test(@Body() body: any) {
    console.log('Test endpoint received:', body);
    return { message: 'Test successful', data: body };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryUsersDto) {
    return this.userService.findAll(queryDto);
  }

  @Get('cursor')
  cursorPaginate(@Query() queryDto: CursorQueryDto) {
    return this.userService.cursorPaginate(queryDto);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.userService.search(query);
  }

  @Get('stats')
  getStats() {
    return this.userService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Body() softDeleteDto: SoftDeleteDto) {
    return this.userService.remove(id, softDeleteDto);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }

  @Post('bulk-upsert')
  bulkUpsert(@Body() bulkUpsertDto: BulkUpsertDto) {
    return this.userService.bulkUpsert(bulkUpsertDto);
  }
}
