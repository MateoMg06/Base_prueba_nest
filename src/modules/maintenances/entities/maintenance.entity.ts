import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ enum: MaintenanceType })
  @Column({ type: 'simple-enum', enum: MaintenanceType })
  tipo: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({ example: 45200 })
  @Column({ type: 'int', name: 'kilometraje_registrado' })
  kilometrajeRegistrado: number;

  @ApiProperty({ example: '2026-11-02T07:30:00-05:00' })
  @Index()
  @Column({ name: 'fecha_programada', type: 'timestamptz' })
  fechaProgramada: Date;

  @ApiProperty({ example: 90 })
  @Column({ type: 'int', name: 'duracion_estimada_minutos' })
  duracionEstimadaMinutos: number;

  @ApiProperty({ enum: MaintenanceStatus })
  @Column({
    type: 'simple-enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  estado: MaintenanceStatus;

  @ApiPropertyOptional()
  @Column({ type: 'text', name: 'trabajo_realizado', nullable: true })
  trabajoRealizado?: string;

  @ApiPropertyOptional({ example: '350000.00' })
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'costo_final',
    nullable: true,
  })
  costoFinal?: string;

  @ApiPropertyOptional()
  @Column({ name: 'fecha_finalizacion', type: 'timestamptz', nullable: true })
  fechaFinalizacion?: Date;

  @ApiPropertyOptional()
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
