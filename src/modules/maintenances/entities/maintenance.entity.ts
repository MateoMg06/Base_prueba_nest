import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';
import { MaintenanceStatus } from '../enums/maintenance-status.enum.js';
import { MaintenanceType } from '../enums/maintenance-type.enum.js';

@Entity('maintenances')
@Index(['vehiculo', 'estado'])
@Index(['mecanico', 'estado'])
export class Maintenance extends BaseEntity {
  @Column({ type: 'simple-enum', enum: MaintenanceType })
  tipo: MaintenanceType;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'int', name: 'kilometraje_registrado' })
  kilometrajeRegistrado: number;

  @Index()
  @Column({ name: 'fecha_programada' })
  fechaProgramada: Date;

  @Column({ type: 'int', name: 'duracion_estimada_minutos' })
  duracionEstimadaMinutos: number;

  @Column({
    type: 'simple-enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  estado: MaintenanceStatus;

  @Column({ type: 'text', name: 'trabajo_realizado', nullable: true })
  trabajoRealizado?: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'costo_final',
    nullable: true,
  })
  costoFinal?: string;

  @Column({ name: 'fecha_finalizacion', nullable: true })
  fechaFinalizacion?: Date;

  @Column({ type: 'int', name: 'kilometraje_final', nullable: true })
  kilometrajeFinal?: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehiculo: Relation<Vehicle>;

  @ManyToOne(() => Mechanic, (mechanic) => mechanic.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mechanic_id' })
  mecanico: Relation<Mechanic>;

  @ManyToOne(() => Workshop, (workshop) => workshop.maintenances, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'workshop_id' })
  taller: Relation<Workshop>;
}
