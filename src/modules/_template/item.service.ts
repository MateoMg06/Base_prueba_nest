import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { Item } from './entities/item.entity.js';

/** Columnas por las que se permite ordenar (evita ordenar por cualquier campo). */
const SORTABLE_COLUMNS = ['id', 'nombre', 'creadaEn'] as const;

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item) private readonly items: Repository<Item>,
  ) {}

  create(dto: CreateItemDto): Promise<Item> {
    return this.items.save(this.items.create(dto));
  }

  async findAll(query: PaginationQueryDto) {
    const sortBy = SORTABLE_COLUMNS.find((c) => c === query.sortBy) ?? 'id';
    const [items, total] = await this.items.findAndCount({
      order: { [sortBy]: query.order },
      skip: query.skip,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.items.findOneBy({ id });
    if (!item) throw new NotFoundException(`Item ${id} no encontrado`);
    return item;
  }

  async update(id: number, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    return this.items.save(this.items.merge(item, dto));
  }

  async remove(id: number): Promise<void> {
    await this.items.remove(await this.findOne(id));
  }
}
