import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { Paginated } from '../../common/interfaces/paginated.interface.js';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenances/enums/maintenance-status.enum.js';
import { User } from '../users/entities/user.entity.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { MechanicQueryDto } from './dto/mechanic-query.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicStatus } from './enums/mechanic-status.enum.js';

const SORTABLE_COLUMNS = ['id', 'nombre', 'especialidad'] as const;
const ACTIVE_MAINTENANCE = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanics: Repository<Mechanic>,
    @InjectRepository(Maintenance)
    private readonly maintenances: Repository<Maintenance>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const { usuarioId, ...data } = dto;
    await this.assertEmailIsFree(data.correo);
    const mechanic = this.mechanics.create(data);
    if (usuarioId) mechanic.usuario = await this.linkableTechnician(usuarioId);
    const { id } = await this.mechanics.save(mechanic);
    return this.findOne(id);
  }

  async findAll(query: MechanicQueryDto): Promise<Paginated<Mechanic>> {
    const sortBy = SORTABLE_COLUMNS.find((c) => c === query.sortBy) ?? 'id';
    const [items, total] = await this.mechanics.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      relations: { usuario: true },
      order: { [sortBy]: query.order },
      skip: query.skip,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number): Promise<Mechanic> {
    const mechanic = await this.mechanics.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!mechanic) throw new NotFoundException(`Mecánico ${id} no encontrado`);
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto): Promise<Mechanic> {
    const { usuarioId, ...data } = dto;
    const mechanic = await this.findOne(id);
    if (data.correo && data.correo !== mechanic.correo) {
      await this.assertEmailIsFree(data.correo);
    }
    if (usuarioId && usuarioId !== mechanic.usuario?.id) {
      mechanic.usuario = await this.linkableTechnician(usuarioId);
    }
    await this.mechanics.save(this.mechanics.merge(mechanic, data));
    return this.findOne(id);
  }

  /**
   * Inactivación lógica: conserva el historial de mantenimientos. Se bloquea
   * si tiene mantenimientos programados o en curso, que quedarían sin mecánico.
   */
  async deactivate(id: number): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (mechanic.estado === MechanicStatus.INACTIVE) return mechanic;

    const active = await this.maintenances.countBy({
      mecanico: { id },
      estado: In(ACTIVE_MAINTENANCE),
    });
    if (active > 0) {
      throw new ConflictException(
        'No se puede inactivar un mecánico con mantenimientos programados o en curso',
      );
    }
    mechanic.estado = MechanicStatus.INACTIVE;
    return this.mechanics.save(mechanic);
  }

  async activate(id: number): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.estado = MechanicStatus.ACTIVE;
    return this.mechanics.save(mechanic);
  }

  /** Mecánico existente y ACTIVE: requisito para asignarlo a un mantenimiento. */
  async findAssignable(id: number): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (mechanic.estado !== MechanicStatus.ACTIVE) {
      throw new ConflictException(
        `El mecánico ${id} está inactivo y no puede recibir mantenimientos`,
      );
    }
    return mechanic;
  }

  /**
   * Un mecánico no puede tener dos mantenimientos activos (SCHEDULED o
   * IN_PROGRESS) cuyos horarios se crucen, en ningún taller. Los intervalos
   * son semiabiertos [inicio, fin): uno de 7:30 a 9:00 no choca con otro que
   * empieza a las 9:00.
   */
  async assertScheduleAvailable(
    mechanicId: number,
    start: Date,
    durationMinutes: number,
    excludeMaintenanceId?: number,
  ): Promise<void> {
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const query = this.maintenances
      .createQueryBuilder('maintenance')
      .where('maintenance.mecanico = :mechanicId', { mechanicId })
      .andWhere('maintenance.estado IN (:...estados)', {
        estados: ACTIVE_MAINTENANCE,
      })
      .andWhere('maintenance.fechaProgramada < :end', { end })
      .andWhere(
        "maintenance.fechaProgramada + maintenance.duracionEstimadaMinutos * INTERVAL '1 minute' > :start",
        { start },
      );
    if (excludeMaintenanceId) {
      query.andWhere('maintenance.id <> :excludeMaintenanceId', {
        excludeMaintenanceId,
      });
    }

    const clash = await query.getOne();
    if (clash) {
      throw new ConflictException(
        `El mecánico ${mechanicId} ya tiene el mantenimiento ${clash.id} ` +
          `programado el ${clash.fechaProgramada.toISOString()} que se cruza con ese horario`,
      );
    }
  }

  private async assertEmailIsFree(correo: string): Promise<void> {
    if (await this.mechanics.existsBy({ correo })) {
      throw new ConflictException(`Ya existe un mecánico con correo ${correo}`);
    }
  }

  /** Solo un TECHNICIAN existente y sin otro mecánico vinculado. */
  private async linkableTechnician(usuarioId: number): Promise<User> {
    const user = await this.users.findOneBy({ id: usuarioId });
    if (!user)
      throw new NotFoundException(`Usuario ${usuarioId} no encontrado`);
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException(
        `Solo se puede vincular un usuario TECHNICIAN (el usuario ${usuarioId} es ${user.role})`,
      );
    }
    if (await this.mechanics.existsBy({ usuario: { id: usuarioId } })) {
      throw new ConflictException(
        `El usuario ${usuarioId} ya está vinculado a otro mecánico`,
      );
    }
    return user;
  }
}
