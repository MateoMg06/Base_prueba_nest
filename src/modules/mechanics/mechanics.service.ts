import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenances/enums/maintenance-status.enum.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { MechanicQueryDto } from './dto/mechanic-query.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicStatus } from './enums/mechanic-status.enum.js';

// Un mantenimiento "activo" es uno programado o en curso
const ACTIVE_STATUSES = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicRepository: Repository<Mechanic>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateMechanicDto) {
    await this.checkEmail(dto.correo);
    const mechanic = this.mechanicRepository.create({
      nombre: dto.nombre,
      correo: dto.correo,
      especialidad: dto.especialidad,
    });
    if (dto.usuarioId) {
      mechanic.usuario = await this.getTechnician(dto.usuarioId);
    }
    const saved = await this.mechanicRepository.save(mechanic);
    return this.findOne(saved.id);
  }

  async findAll(query: MechanicQueryDto) {
    const [items, total] = await this.mechanicRepository.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      relations: { usuario: true },
      order: { id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const mechanic = await this.mechanicRepository.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!mechanic) {
      throw new NotFoundException(`Mecánico ${id} no encontrado`);
    }
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto) {
    const mechanic = await this.findOne(id);
    if (dto.correo && dto.correo !== mechanic.correo) {
      await this.checkEmail(dto.correo);
    }
    if (dto.usuarioId && dto.usuarioId !== mechanic.usuario?.id) {
      mechanic.usuario = await this.getTechnician(dto.usuarioId);
    }
    if (dto.nombre) mechanic.nombre = dto.nombre;
    if (dto.correo) mechanic.correo = dto.correo;
    if (dto.especialidad) mechanic.especialidad = dto.especialidad;
    await this.mechanicRepository.save(mechanic);
    return this.findOne(id);
  }

  // Inactivar no borra su historial de mantenimientos
  async deactivate(id: number) {
    const mechanic = await this.findOne(id);
    const activeMaintenances = await this.maintenanceRepository.countBy({
      mecanico: { id },
      estado: In(ACTIVE_STATUSES),
    });
    if (activeMaintenances > 0) {
      throw new ConflictException(
        'No se puede inactivar un mecánico con mantenimientos programados o en curso',
      );
    }
    mechanic.estado = MechanicStatus.INACTIVE;
    return this.mechanicRepository.save(mechanic);
  }

  async activate(id: number) {
    const mechanic = await this.findOne(id);
    mechanic.estado = MechanicStatus.ACTIVE;
    return this.mechanicRepository.save(mechanic);
  }

  // Para asignar un mantenimiento el mecánico debe existir y estar activo
  async getActiveMechanic(id: number) {
    const mechanic = await this.findOne(id);
    if (mechanic.estado !== MechanicStatus.ACTIVE) {
      throw new ConflictException(`El mecánico ${id} está inactivo`);
    }
    return mechanic;
  }

  // Revisa que el mecánico no tenga otro mantenimiento activo que se cruce
  // con el horario [start, start + minutes), en ningún taller.
  // Ej: si tiene uno de 7:30 a 9:00, uno a las 8:00 choca y uno a las 9:00 no.
  // Si se llama dentro de una transacción se le pasa su manager.
  async checkSchedule(
    mechanicId: number,
    start: Date,
    minutes: number,
    manager?: EntityManager,
  ) {
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    const repository = manager
      ? manager.getRepository(Maintenance)
      : this.maintenanceRepository;

    const conflict = await repository
      .createQueryBuilder('m')
      .where('m.mecanico = :mechanicId', { mechanicId })
      .andWhere('m.estado IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('m.fechaProgramada < :end', { end })
      .andWhere(
        "m.fechaProgramada + m.duracionEstimadaMinutos * INTERVAL '1 minute' > :start",
        { start },
      )
      .getOne();
    if (conflict) {
      throw new ConflictException(
        `El mecánico ${mechanicId} ya tiene el mantenimiento ${conflict.id} en ese horario`,
      );
    }
  }

  private async checkEmail(correo: string) {
    const exists = await this.mechanicRepository.existsBy({ correo });
    if (exists) {
      throw new ConflictException(`Ya existe un mecánico con correo ${correo}`);
    }
  }

  // Solo se puede vincular un usuario TECHNICIAN que no tenga ya un mecánico
  private async getTechnician(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuario ${userId} no encontrado`);
    }
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException(
        'Solo se puede vincular un usuario TECHNICIAN',
      );
    }
    const alreadyLinked = await this.mechanicRepository.existsBy({
      usuario: { id: userId },
    });
    if (alreadyLinked) {
      throw new ConflictException(
        `El usuario ${userId} ya está vinculado a otro mecánico`,
      );
    }
    return user;
  }
}
