import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleStatus } from './enums/vehicle-status.enum.js';
import { VehiclesService } from './vehicles.service.js';

const vehicle = (overrides: Partial<Vehicle> = {}) =>
  ({
    id: 1,
    placa: 'ABC123',
    marca: 'Chevrolet',
    modelo: 'NHR',
    anio: 2022,
    kilometraje: 1000,
    estado: VehicleStatus.AVAILABLE,
    ...overrides,
  }) as Vehicle;

describe('VehiclesService', () => {
  let vehicles: Record<string, ReturnType<typeof vi.fn>>;
  let maintenances: { countBy: ReturnType<typeof vi.fn> };
  let service: VehiclesService;

  beforeEach(() => {
    vehicles = {
      existsBy: vi.fn().mockResolvedValue(false),
      findOneBy: vi.fn().mockResolvedValue(vehicle()),
      create: vi.fn((dto: Partial<Vehicle>) => dto),
      merge: vi.fn((v: Vehicle, dto: Partial<Vehicle>) => ({ ...v, ...dto })),
      save: vi.fn((v: Vehicle) => Promise.resolve(v)),
    };
    maintenances = { countBy: vi.fn().mockResolvedValue(0) };
    service = new VehiclesService(
      vehicles as unknown as Repository<Vehicle>,
      maintenances as unknown as Repository<Maintenance>,
    );
  });

  it('rechaza con 409 una placa ya registrada', async () => {
    vehicles.existsBy.mockResolvedValue(true);
    await expect(
      service.create({
        placa: 'ABC123',
        marca: 'X',
        modelo: 'Y',
        anio: 2020,
        kilometraje: 0,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('responde 404 si el vehículo no existe', async () => {
    vehicles.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('no permite reducir el kilometraje', async () => {
    await expect(service.update(1, { kilometraje: 500 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('inactiva lógicamente si no hay mantenimientos activos', async () => {
    await expect(service.deactivate(1)).resolves.toMatchObject({
      estado: VehicleStatus.INACTIVE,
    });
  });

  it('impide inactivar con mantenimientos programados o en curso', async () => {
    maintenances.countBy.mockResolvedValue(1);
    await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
  });
});
