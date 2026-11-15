import {
  Authorized, Body, CurrentUser, Delete, Get, HttpCode,
  JsonController, OnUndefined, Param, Patch, Post, QueryParams,
} from 'routing-controllers';
import { User } from '../users/user.entity';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { ListReadingsQueryDto } from './dto/list-readings-query.dto';
import { ReadingsService } from './readings.service';

@Authorized()
@JsonController('/readings')
export class ReadingsController {
  private service = new ReadingsService();

  @Get()
  list(@CurrentUser({ required: true }) user: User, @QueryParams() query: ListReadingsQueryDto) {
    return this.service.list(user.id, query.date);
  }

  @Get('/:id')
  async get(@CurrentUser({ required: true }) user: User, @Param('id') id: string) {
    return { reading: await this.service.get(user.id, id) };
  }

  @Post()
  @HttpCode(201)
  async create(@CurrentUser({ required: true }) user: User, @Body({ required: true }) input: CreateReadingDto) {
    return { reading: await this.service.create(user.id, input) };
  }

  @Patch('/:id')
  async update(
    @CurrentUser({ required: true }) user: User, @Param('id') id: string,
    @Body({ required: true }) input: UpdateReadingDto,
  ) {
    return { reading: await this.service.update(user.id, id, input) };
  }

  @Delete('/:id')
  @OnUndefined(204)
  async delete(@CurrentUser({ required: true }) user: User, @Param('id') id: string) {
    await this.service.delete(user.id, id);
    return undefined;
  }
}
