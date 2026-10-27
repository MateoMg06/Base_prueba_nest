import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicStatus } from './enums/mechanic-status.enum.js';
import { MechanicsService } from './mechanics.service.js';

const mechanic = (overrides: Partial<Mechanic> = {}) =>
  ({
    id: 1,
    nombre: 'Carlos',
    correo: 'carlos@fleetcore.com',
    especialidad: 'Frenos',
    estado: MechanicStatus.ACTIVE,
    usuario: null,
    ...overrides,
  }) as Mechanic;

describe('MechanicsService', () => {
  let mechanics: Record<string, jest.Mock>;
  let maintenances: Record<string, jest.Mock>;
  let users: { findOneBy: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;
  let service: MechanicsService;

  beforeEach(() => {
    mechanics = {
      existsBy: jest.fn().mockResolvedValue(false),
      findOne: jest.fn().mockResolvedValue(mechanic()),
      create: jest.fn((dto: Partial<Mechanic>) => ({ ...dto })),
      merge: jest.fn((m: Mechanic, dto: Partial<Mechanic>) => ({
        ...m,
        ...dto,
      })),
      save: jest.fn((m: Mechanic) => Promise.resolve({ ...m, id: 1 })),
    };
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    maintenances = {
      countBy: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    users = { findOneBy: jest.fn() };
    service = new MechanicsService(
      mechanics as unknown as Repository<Mechanic>,
      maintenances as unknown as Repository<Maintenance>,
      users as unknown as Repository<User>,
    );
  });

  it('rechaza con 409 un correo ya registrado', async () => {
    mechanics.existsBy.mockResolvedValue(true);
    await expect(
      service.create({ nombre: 'A', correo: 'a@a.co', especialidad: 'B' }),
    ).rejects.toThrow(ConflictException);
  });

  it('solo vincula usuarios con rol TECHNICIAN', async () => {
    users.findOneBy.mockResolvedValue({ id: 5, role: Role.ADMIN });
    await expect(
      service.create({
        nombre: 'A',
        correo: 'a@a.co',
        especialidad: 'B',
        usuarioId: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('impide inactivar con mantenimientos activos', async () => {
    maintenances.countBy.mockResolvedValue(2);
    await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
  });

  it('un mecánico inactivo no es asignable', async () => {
    mechanics.findOne.mockResolvedValue(
      mechanic({ estado: MechanicStatus.INACTIVE }),
    );
    await expect(service.getActiveMechanic(1)).rejects.toThrow(
      ConflictException,
    );
  });

  it('responde 404 si el mecánico no existe', async () => {
    mechanics.findOne.mockResolvedValue(null);
    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
  });

  it('consulta el cruce con intervalo [inicio, fin) y rechaza si existe', async () => {
    const start = new Date('2026-11-02T07:30:00-05:00');
    await expect(service.checkSchedule(1, start, 90)).resolves.toBeUndefined();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'm.fechaProgramada < :end',
      { end: new Date('2026-11-02T09:00:00-05:00') },
    );

    queryBuilder.getOne.mockResolvedValue({ id: 3, fechaProgramada: start });
    await expect(service.checkSchedule(1, start, 90)).rejects.toThrow(
      ConflictException,
    );
  });
});
