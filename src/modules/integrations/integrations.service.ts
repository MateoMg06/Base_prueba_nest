import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum.js';

export type FleetStatusSummary = Record<VehicleStatus, number> & {
  total: number;
};

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
  ) {}

  /** Disponibilidad agregada de la flota para sistemas externos. */
  async fleetStatus(): Promise<FleetStatusSummary> {
    const rows = await this.vehicles
      .createQueryBuilder('vehicle')
      .select('vehicle.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vehicle.estado')
      .getRawMany<{ estado: VehicleStatus; count: string }>();

    const summary = Object.fromEntries(
      Object.values(VehicleStatus).map((status) => [status, 0]),
    ) as FleetStatusSummary;
    summary.total = 0;
    for (const { estado, count } of rows) {
      summary[estado] = Number(count);
      summary.total += Number(count);
    }
    return summary;
  }
}
