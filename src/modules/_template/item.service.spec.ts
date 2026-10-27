import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Item } from './entities/item.entity.js';
import { ItemService } from './item.service.js';

const repositoryMock = () => ({
  create: vi.fn((dto: Partial<Item>) => dto as Item),
  save: vi.fn((item: Item) => Promise.resolve({ ...item, id: 1 })),
  findAndCount: vi.fn(() => Promise.resolve([[], 0])),
  findOneBy: vi.fn(() => Promise.resolve(null)),
  merge: vi.fn((item: Item, dto: Partial<Item>) => ({ ...item, ...dto })),
  remove: vi.fn(),
});

describe('ItemService', () => {
  let repo: ReturnType<typeof repositoryMock>;
  let service: ItemService;

  beforeEach(() => {
    repo = repositoryMock();
    service = new ItemService(repo as unknown as Repository<Item>);
  });

  it('crea un item', async () => {
    await expect(service.create({ nombre: 'Filtro' })).resolves.toMatchObject({
      id: 1,
      nombre: 'Filtro',
    });
  });

  it('pagina con page y limit', async () => {
    const query = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '5',
    });
    await service.findAll(query);
    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { id: 'ASC' },
      skip: 5,
      take: 5,
    });
  });

  it('lanza 404 si el item no existe', async () => {
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });
});
