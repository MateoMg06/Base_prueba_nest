import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenances/enums/maintenance-status.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleQueryDto } from './dto/vehicle-query.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleStatus } from './enums/vehicle-status.enum.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
  ) {}

  async create(dto: CreateVehicleDto) {
    await this.checkPlate(dto.placa);
    return this.vehicleRepository.save(this.vehicleRepository.create(dto));
  }

  async findAll(query: VehicleQueryDto) {
    const [items, total] = await this.vehicleRepository.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      order: { id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const vehicle = await this.vehicleRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo ${id} no encontrado`);
    }
    return vehicle;
  }

  async findByPlate(placa: string) {
    const vehicle = await this.vehicleRepository.findOneBy({
      placa: placa.toUpperCase(),
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con placa ${placa} no encontrado`);
    }
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);
    if (dto.placa && dto.placa !== vehicle.placa) {
      await this.checkPlate(dto.placa);
    }
    // El kilometraje solo puede subir
    if (
      dto.kilometraje !== undefined &&
      dto.kilometraje < vehicle.kilometraje
    ) {
      throw new BadRequestException(
        `El kilometraje no puede ser menor al actual (${vehicle.kilometraje})`,
      );
    }
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  // Eliminación lógica: se marca INACTIVE y se conserva el historial
  async deactivate(id: number) {
    const vehicle = await this.findOne(id);
    const activeMaintenances = await this.maintenanceRepository.countBy({
      vehiculo: { id },
      estado: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
    });
    if (activeMaintenances > 0) {
      throw new ConflictException(
        'No se puede inactivar un vehículo con mantenimientos programados o en curso',
      );
    }
    vehicle.estado = VehicleStatus.INACTIVE;
    return this.vehicleRepository.save(vehicle);
  }

  async activate(id: number) {
    const vehicle = await this.findOne(id);
    if (vehicle.estado !== VehicleStatus.INACTIVE) {
      throw new ConflictException('Solo se puede activar un vehículo INACTIVE');
    }
    vehicle.estado = VehicleStatus.AVAILABLE;
    return this.vehicleRepository.save(vehicle);
  }

  private async checkPlate(placa: string) {
    const exists = await this.vehicleRepository.existsBy({ placa });
    if (exists) {
      throw new ConflictException(`Ya existe un vehículo con placa ${placa}`);
    }
  }
}
