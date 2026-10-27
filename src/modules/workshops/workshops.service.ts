import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenances/enums/maintenance-status.enum.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopQueryDto } from './dto/workshop-query.dto.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopStatus } from './enums/workshop-status.enum.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepository: Repository<Workshop>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
  ) {}

  create(dto: CreateWorkshopDto) {
    return this.workshopRepository.save(this.workshopRepository.create(dto));
  }

  async findAll(query: WorkshopQueryDto) {
    const [items, total] = await this.workshopRepository.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      order: { id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  findActive() {
    return this.workshopRepository.find({
      where: { estado: WorkshopStatus.ACTIVE },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const workshop = await this.workshopRepository.findOneBy({ id });
    if (!workshop) {
      throw new NotFoundException(`Taller ${id} no encontrado`);
    }
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const workshop = await this.findOne(id);
    Object.assign(workshop, dto);
    return this.workshopRepository.save(workshop);
  }

  async deactivate(id: number) {
    const workshop = await this.findOne(id);
    const activeMaintenances = await this.maintenanceRepository.countBy({
      taller: { id },
      estado: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
    });
    if (activeMaintenances > 0) {
      throw new ConflictException(
        'No se puede inactivar un taller con mantenimientos programados o en curso',
      );
    }
    workshop.estado = WorkshopStatus.INACTIVE;
    return this.workshopRepository.save(workshop);
  }

  async activate(id: number) {
    const workshop = await this.findOne(id);
    workshop.estado = WorkshopStatus.ACTIVE;
    return this.workshopRepository.save(workshop);
  }

  // Para asignar un mantenimiento el taller debe existir y estar activo
  async getActiveWorkshop(id: number) {
    const workshop = await this.findOne(id);
    if (workshop.estado !== WorkshopStatus.ACTIVE) {
      throw new ConflictException(`El taller ${id} está inactivo`);
    }
    return workshop;
  }
}
