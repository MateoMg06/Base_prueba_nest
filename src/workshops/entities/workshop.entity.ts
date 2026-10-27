import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { WorkshopStatus } from '../enums/workshop-status.enum.js';

@Entity('workshops')
export class Workshop extends BaseEntity {
  @Column({ length: 120 })
  nombre: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({
    type: 'simple-enum',
    enum: WorkshopStatus,
    default: WorkshopStatus.ACTIVE,
  })
  estado: WorkshopStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.taller)
  maintenances: Maintenance[];
}
