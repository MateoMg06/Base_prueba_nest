import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatus } from './enums/maintenance-status.enum.js';
import { MaintenanceType } from './enums/maintenance-type.enum.js';
import { MaintenancesService } from './maintenances.service.js';

const admin = { id: 1, email: 'admin@fleetcore.com', role: Role.ADMIN };
const technician = { id: 2, email: 'tec@fleetcore.com', role: Role.TECHNICIAN };

const buildMaintenance = (estado: MaintenanceStatus) => ({
  id: 10,
  estado,
  kilometrajeRegistrado: 1000,
  vehiculo: {
    id: 1,
    placa: 'ABC123',
    kilometraje: 1000,
    estado: VehicleStatus.AVAILABLE,
  },
  mecanico: { id: 3, usuario: { id: 2 } },
});

describe('MaintenancesService', () => {
  let manager: Record<string, jest.Mock>;
  let mechanicsService: Record<string, jest.Mock>;
  let service: MaintenancesService;
  let current: ReturnType<typeof buildMaintenance>;

  beforeEach(() => {
    current = buildMaintenance(MaintenanceStatus.SCHEDULED);
    manager = {
      findOne: jest.fn(() => Promise.resolve(current)),
      countBy: jest.fn().mockResolvedValue(0),
      create: jest.fn((_entity: unknown, data: object) => data),
      save: jest.fn((_entity: unknown, data?: object) =>
        Promise.resolve({ id: 10, ...(data ?? (_entity as object)) }),
      ),
    };
    const dataSource = {
      transaction: (work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
    };
    mechanicsService = {
      getActiveMechanic: jest.fn().mockResolvedValue({ id: 3 }),
      checkSchedule: jest.fn().mockResolvedValue(undefined),
    };
    const workshopsService = {
      getActiveWorkshop: jest.fn().mockResolvedValue({ id: 4 }),
    };
    const maintenanceRepository = {
      findOne: jest.fn(() => Promise.resolve(current)),
    };
    service = new MaintenancesService(
      maintenanceRepository as unknown as Repository<Maintenance>,
      dataSource as unknown as DataSource,
      mechanicsService as unknown as MechanicsService,
      workshopsService as unknown as WorkshopsService,
    );
  });

  describe('updateStatus', () => {
    it('IN_PROGRESS pone el vehículo en IN_MAINTENANCE', async () => {
      await service.updateStatus(
        10,
        { estado: MaintenanceStatus.IN_PROGRESS },
        admin,
      );
      expect(current.estado).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(current.vehiculo.estado).toBe(VehicleStatus.IN_MAINTENANCE);
    });

    it('COMPLETED guarda el cierre y deja el vehículo AVAILABLE', async () => {
      current = buildMaintenance(MaintenanceStatus.IN_PROGRESS);
      current.vehiculo.estado = VehicleStatus.IN_MAINTENANCE;
      await service.updateStatus(
        10,
        {
          estado: MaintenanceStatus.COMPLETED,
          trabajoRealizado: 'Cambio de aceite',
          costoFinal: 200000,
          fechaFinalizacion: '2026-11-02T10:00:00-05:00',
          kilometrajeFinal: 1050,
        },
        admin,
      );
      expect(current.estado).toBe(MaintenanceStatus.COMPLETED);
      expect(current.vehiculo.estado).toBe(VehicleStatus.AVAILABLE);
      expect(current.vehiculo.kilometraje).toBe(1050);
    });

    it('un COMPLETED no puede volver a un estado anterior', async () => {
      current = buildMaintenance(MaintenanceStatus.COMPLETED);
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.IN_PROGRESS },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('un CANCELLED no puede pasar a IN_PROGRESS ni a COMPLETED', async () => {
      current = buildMaintenance(MaintenanceStatus.CANCELLED);
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.IN_PROGRESS },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.COMPLETED },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('no se puede completar sin pasar por IN_PROGRESS', async () => {
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.COMPLETED },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('el mecánico no puede tener dos mantenimientos en curso', async () => {
      manager.countBy.mockResolvedValue(1);
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.IN_PROGRESS },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('un técnico no puede cambiar un mantenimiento que no es suyo', async () => {
      const otherTechnician = { ...technician, id: 99 };
      await expect(
        service.updateStatus(
          10,
          { estado: MaintenanceStatus.IN_PROGRESS },
          otherTechnician,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const dto = {
      tipo: MaintenanceType.PREVENTIVE,
      descripcion: 'Cambio de aceite',
      kilometraje: 1000,
      fechaProgramada: '2026-11-02T07:30:00-05:00',
      duracionEstimadaMinutos: 90,
      vehiculoId: 1,
      mecanicoId: 3,
      tallerId: 4,
    };

    it('crea el mantenimiento en estado SCHEDULED', async () => {
      current = buildMaintenance(MaintenanceStatus.SCHEDULED);
      manager.findOne.mockResolvedValueOnce(current.vehiculo);
      await service.create(dto);
      expect(manager.create).toHaveBeenCalledWith(
        Maintenance,
        expect.objectContaining({ estado: MaintenanceStatus.SCHEDULED }),
      );
      expect(mechanicsService.checkSchedule).toHaveBeenCalled();
    });

    it('rechaza un kilometraje menor al del vehículo', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 1,
        kilometraje: 5000,
        estado: VehicleStatus.AVAILABLE,
      });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('rechaza un vehículo INACTIVE', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 1,
        kilometraje: 0,
        estado: VehicleStatus.INACTIVE,
      });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('rechaza si el vehículo ya tiene un mantenimiento activo', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 1,
        kilometraje: 0,
        estado: VehicleStatus.AVAILABLE,
      });
      manager.countBy.mockResolvedValue(1);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
