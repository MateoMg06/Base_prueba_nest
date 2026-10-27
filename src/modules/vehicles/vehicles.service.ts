import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenances/enums/maintenance-status.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleQueryDto } from './dto/vehicle-query.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleStatus } from './enums/vehicle-status.enum.js';

const SORTABLE_COLUMNS = [
  'id',
  'placa',
  'marca',
  'anio',
  'kilometraje',
] as const;

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private readonly maintenances: Repository<Maintenance>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.assertPlateIsFree(dto.placa);
    return this.vehicles.save(this.vehicles.create(dto));
  }

  async findAll(query: VehicleQueryDto): Promise<Paginated<Vehicle>> {
    const sortBy = SORTABLE_COLUMNS.find((c) => c === query.sortBy) ?? 'id';
    const [items, total] = await this.vehicles.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      order: { [sortBy]: query.order },
      skip: query.skip,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return vehicle;
  }

  async findByPlate(placa: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOneBy({
      placa: placa.trim().toUpperCase(),
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con placa ${placa} no encontrado`);
    }
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (dto.placa && dto.placa !== vehicle.placa) {
      await this.assertPlateIsFree(dto.placa);
    }
    // El odómetro solo avanza: un kilometraje menor indica un error de captura.
    if (
      dto.kilometraje !== undefined &&
      dto.kilometraje < vehicle.kilometraje
    ) {
      throw new BadRequestException(
        `El kilometraje no puede ser menor al actual (${vehicle.kilometraje})`,
      );
    }
    return this.vehicles.save(this.vehicles.merge(vehicle, dto));
  }

  /**
   * Eliminación lógica: el vehículo pasa a INACTIVE y conserva su historial.
   * No se permite mientras tenga mantenimientos programados o en curso.
   */
  async deactivate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.estado === VehicleStatus.INACTIVE) return vehicle;

    const active = await this.maintenances.countBy({
      vehiculo: { id },
      estado: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
    });
    if (active > 0) {
      throw new ConflictException(
        'No se puede inactivar un vehículo con mantenimientos programados o en curso',
      );
    }
    vehicle.estado = VehicleStatus.INACTIVE;
    return this.vehicles.save(vehicle);
  }

  async activate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.estado !== VehicleStatus.INACTIVE) {
      throw new ConflictException(
        `Solo se puede activar un vehículo INACTIVE (estado actual: ${vehicle.estado})`,
      );
    }
    vehicle.estado = VehicleStatus.AVAILABLE;
    return this.vehicles.save(vehicle);
  }

  private async assertPlateIsFree(placa: string): Promise<void> {
    if (await this.vehicles.existsBy({ placa })) {
      throw new ConflictException(`Ya existe un vehículo con placa ${placa}`);
    }
  }
}
