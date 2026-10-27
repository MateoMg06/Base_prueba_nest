import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum.js';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  // Cantidad de vehículos por estado, para sistemas externos
  async fleetStatus() {
    const available = await this.vehicleRepository.countBy({
      estado: VehicleStatus.AVAILABLE,
    });
    const inMaintenance = await this.vehicleRepository.countBy({
      estado: VehicleStatus.IN_MAINTENANCE,
    });
    const inactive = await this.vehicleRepository.countBy({
      estado: VehicleStatus.INACTIVE,
    });
    return {
      AVAILABLE: available,
      IN_MAINTENANCE: inMaintenance,
      INACTIVE: inactive,
      total: available + inMaintenance + inactive,
    };
  }
}
