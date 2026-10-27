import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopStatus } from './enums/workshop-status.enum.js';
import { WorkshopsService } from './workshops.service.js';

describe('WorkshopsService', () => {
  let workshopRepository: Record<string, jest.Mock>;
  let maintenanceRepository: { countBy: jest.Mock };
  let service: WorkshopsService;

  beforeEach(() => {
    workshopRepository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        nombre: 'Taller Central',
        estado: WorkshopStatus.ACTIVE,
      }),
      save: jest.fn((workshop: Workshop) => Promise.resolve(workshop)),
    };
    maintenanceRepository = { countBy: jest.fn().mockResolvedValue(0) };
    service = new WorkshopsService(
      workshopRepository as unknown as Repository<Workshop>,
      maintenanceRepository as unknown as Repository<Maintenance>,
    );
  });

  it('responde 404 si el taller no existe', async () => {
    workshopRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
  });

  it('inactiva un taller sin mantenimientos activos', async () => {
    await expect(service.deactivate(1)).resolves.toMatchObject({
      estado: WorkshopStatus.INACTIVE,
    });
  });

  it('no inactiva un taller con mantenimientos activos', async () => {
    maintenanceRepository.countBy.mockResolvedValue(1);
    await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
  });

  it('un taller inactivo no se puede asignar', async () => {
    workshopRepository.findOneBy.mockResolvedValue({
      id: 1,
      estado: WorkshopStatus.INACTIVE,
    });
    await expect(service.getActiveWorkshop(1)).rejects.toThrow(
      ConflictException,
    );
  });
});
