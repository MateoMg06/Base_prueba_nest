import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatus } from './enums/maintenance-status.enum.js';

const ACTIVE_STATUSES = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

// Cambios de estado permitidos. COMPLETED y CANCELLED son finales:
// un COMPLETED no vuelve atrás y un CANCELLED no pasa a IN_PROGRESS ni COMPLETED.
const ALLOWED_CHANGES: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  SCHEDULED: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  IN_PROGRESS: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

// Relaciones que se devuelven con cada mantenimiento
const RELATIONS = { vehiculo: true, mecanico: true, taller: true };

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    private readonly dataSource: DataSource,
    private readonly mechanicsService: MechanicsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(dto: CreateMaintenanceDto) {
    // El mecánico y el taller deben existir y estar activos
    const mechanic = await this.mechanicsService.getActiveMechanic(
      dto.mecanicoId,
    );
    const workshop = await this.workshopsService.getActiveWorkshop(
      dto.tallerId,
    );
    const fecha = new Date(dto.fechaProgramada);

    // Transacción: todas las validaciones y el guardado ocurren juntos.
    // Se bloquean (FOR UPDATE) las filas del vehículo y del mecánico para que
    // dos peticiones al mismo tiempo no creen dos mantenimientos activos para
    // el mismo vehículo ni dos horarios cruzados para el mismo mecánico.
    const saved = await this.dataSource.transaction(async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id: dto.vehiculoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehículo ${dto.vehiculoId} no encontrado`);
      }
      if (vehicle.estado === VehicleStatus.INACTIVE) {
        throw new ConflictException(
          `El vehículo ${vehicle.placa} está INACTIVE y no puede recibir mantenimientos`,
        );
      }
      if (dto.kilometraje < vehicle.kilometraje) {
        throw new BadRequestException(
          `El kilometraje (${dto.kilometraje}) no puede ser menor al actual del vehículo (${vehicle.kilometraje})`,
        );
      }

      const vehicleActive = await manager.countBy(Maintenance, {
        vehiculo: { id: vehicle.id },
        estado: In(ACTIVE_STATUSES),
      });
      if (vehicleActive > 0) {
        throw new ConflictException(
          `El vehículo ${vehicle.placa} ya tiene un mantenimiento activo`,
        );
      }

      await manager.findOne(Mechanic, {
        where: { id: mechanic.id },
        lock: { mode: 'pessimistic_write' },
      });
      await this.mechanicsService.checkSchedule(
        mechanic.id,
        fecha,
        dto.duracionEstimadaMinutos,
        manager,
      );

      const maintenance = manager.create(Maintenance, {
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        kilometrajeRegistrado: dto.kilometraje,
        fechaProgramada: fecha,
        duracionEstimadaMinutos: dto.duracionEstimadaMinutos,
        estado: MaintenanceStatus.SCHEDULED,
        vehiculo: vehicle,
        mecanico: mechanic,
        taller: workshop,
      });
      return manager.save(maintenance);
    });

    return this.findOne(saved.id);
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
    user: AuthenticatedUser,
  ) {
    // Transacción: el cambio del mantenimiento y del vehículo se guardan
    // juntos; si algo falla no queda uno cambiado y el otro no.
    await this.dataSource.transaction(async (manager) => {
      // Bloquea la fila para que dos cambios de estado no se pisen
      await manager.findOne(Maintenance, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      const maintenance = await manager.findOne(Maintenance, {
        where: { id },
        relations: { vehiculo: true, mecanico: { usuario: true } },
      });
      if (!maintenance) {
        throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
      }
      this.checkOwner(maintenance, user);

      const from = maintenance.estado;
      const to = dto.estado;
      if (!ALLOWED_CHANGES[from].includes(to)) {
        throw new ConflictException(
          `Transición inválida: un mantenimiento ${from} no puede pasar a ${to}`,
        );
      }

      const vehicle = maintenance.vehiculo;

      if (to === MaintenanceStatus.IN_PROGRESS) {
        // Un técnico no puede tener dos mantenimientos en curso a la vez
        const inProgress = await manager.countBy(Maintenance, {
          mecanico: { id: maintenance.mecanico.id },
          estado: MaintenanceStatus.IN_PROGRESS,
        });
        if (inProgress > 0) {
          throw new ConflictException(
            'El mecánico ya tiene otro mantenimiento en curso',
          );
        }
        vehicle.estado = VehicleStatus.IN_MAINTENANCE;
      }

      if (to === MaintenanceStatus.COMPLETED) {
        // Los datos de cierre ya vienen validados por UpdateStatusDto
        if (dto.kilometrajeFinal! < maintenance.kilometrajeRegistrado) {
          throw new BadRequestException(
            `El kilometraje final no puede ser menor al registrado (${maintenance.kilometrajeRegistrado})`,
          );
        }
        maintenance.trabajoRealizado = dto.trabajoRealizado;
        maintenance.costoFinal = String(dto.costoFinal);
        maintenance.fechaFinalizacion = new Date(dto.fechaFinalizacion!);
        maintenance.kilometrajeFinal = dto.kilometrajeFinal;
        vehicle.estado = VehicleStatus.AVAILABLE;
        vehicle.kilometraje = Math.max(
          vehicle.kilometraje,
          dto.kilometrajeFinal!,
        );
      }

      if (
        to === MaintenanceStatus.CANCELLED &&
        from === MaintenanceStatus.IN_PROGRESS
      ) {
        // Si se cancela uno en curso, el vehículo vuelve a estar disponible
        vehicle.estado = VehicleStatus.AVAILABLE;
      }

      maintenance.estado = to;
      await manager.save(Vehicle, vehicle);
      await manager.save(Maintenance, maintenance);
    });

    return this.findOne(id);
  }

  async findAll(query: MaintenanceQueryDto) {
    const [items, total] = await this.maintenanceRepository.findAndCount({
      where: query.estado ? { estado: query.estado } : {},
      relations: RELATIONS,
      order: { fechaProgramada: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  findActive() {
    return this.maintenanceRepository.find({
      where: { estado: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { fechaProgramada: 'ASC' },
    });
  }

  findByVehicle(vehicleId: number) {
    return this.maintenanceRepository.find({
      where: { vehiculo: { id: vehicleId } },
      relations: RELATIONS,
      order: { fechaProgramada: 'DESC' },
    });
  }

  // Historial: intervenciones terminadas (COMPLETED) del vehículo
  findVehicleHistory(vehicleId: number) {
    return this.maintenanceRepository.find({
      where: {
        vehiculo: { id: vehicleId },
        estado: MaintenanceStatus.COMPLETED,
      },
      relations: RELATIONS,
      order: { fechaFinalizacion: 'DESC' },
    });
  }

  findByMechanic(mechanicId: number) {
    return this.maintenanceRepository.find({
      where: { mecanico: { id: mechanicId } },
      relations: RELATIONS,
      order: { fechaProgramada: 'DESC' },
    });
  }

  // Mantenimientos asignados al técnico logueado (vía su ficha de mecánico)
  findMine(user: AuthenticatedUser) {
    return this.maintenanceRepository.find({
      where: { mecanico: { usuario: { id: user.id } } },
      relations: RELATIONS,
      order: { fechaProgramada: 'ASC' },
    });
  }

  async findOne(id: number, user?: AuthenticatedUser) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: { vehiculo: true, taller: true, mecanico: { usuario: true } },
    });
    if (!maintenance) {
      throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
    }
    if (user) this.checkOwner(maintenance, user);
    return maintenance;
  }

  // Un técnico solo puede ver o cambiar los mantenimientos asignados a él
  private checkOwner(maintenance: Maintenance, user: AuthenticatedUser) {
    if (user.role !== Role.TECHNICIAN) return;
    if (maintenance.mecanico.usuario?.id !== user.id) {
      throw new ForbiddenException('Este mantenimiento no está asignado a ti');
    }
  }
}
