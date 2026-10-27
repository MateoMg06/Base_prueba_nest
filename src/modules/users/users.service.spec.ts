import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let userRepository: Record<string, jest.Mock>;
  let service: UsersService;

  beforeEach(() => {
    userRepository = {
      existsBy: jest.fn().mockResolvedValue(false),
      create: jest.fn((data: Partial<User>) => data),
      save: jest.fn((user: User) => Promise.resolve({ ...user, id: 1 })),
    };
    service = new UsersService(userRepository as unknown as Repository<User>);
  });

  it('crea un usuario nuevo', async () => {
    const user = await service.create({
      email: 'nuevo@fleetcore.com',
      role: Role.TECHNICIAN,
    });
    expect(user.id).toBe(1);
  });

  it('rechaza con 409 un correo ya registrado', async () => {
    userRepository.existsBy.mockResolvedValue(true);
    await expect(
      service.create({ email: 'admin@fleetcore.com' }),
    ).rejects.toThrow(ConflictException);
  });
});
