import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { Item } from './entities/item.entity.js';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
  ) {}

  create(dto: CreateItemDto) {
    return this.itemRepository.save(this.itemRepository.create(dto));
  }

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.itemRepository.findAndCount({
      order: { id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const item = await this.itemRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Item ${id} no encontrado`);
    }
    return item;
  }

  async update(id: number, dto: UpdateItemDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);
  }
}
