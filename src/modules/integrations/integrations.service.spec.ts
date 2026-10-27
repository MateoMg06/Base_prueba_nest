import { Repository } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum.js';
import { IntegrationsService } from './integrations.service.js';

describe('IntegrationsService', () => {
  it('cuenta los vehículos por estado y el total', async () => {
    const counts = {
      [VehicleStatus.AVAILABLE]: 3,
      [VehicleStatus.IN_MAINTENANCE]: 1,
      [VehicleStatus.INACTIVE]: 2,
    };
    const vehicleRepository = {
      countBy: jest.fn(({ estado }: { estado: VehicleStatus }) =>
        Promise.resolve(counts[estado]),
      ),
    };
    const service = new IntegrationsService(
      vehicleRepository as unknown as Repository<Vehicle>,
    );

    await expect(service.fleetStatus()).resolves.toEqual({
      AVAILABLE: 3,
      IN_MAINTENANCE: 1,
      INACTIVE: 2,
      total: 6,
    });
  });
});
