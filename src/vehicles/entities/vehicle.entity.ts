import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { VehicleStatus } from '../enums/vehicle-status.enum.js';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 15 })
  placa: string;

  @Column({ length: 80 })
  marca: string;

  @Column({ length: 80 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int', default: 0 })
  kilometraje: number;

  @Column({
    type: 'simple-enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  estado: VehicleStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.vehiculo)
  maintenances: Maintenance[];
}
