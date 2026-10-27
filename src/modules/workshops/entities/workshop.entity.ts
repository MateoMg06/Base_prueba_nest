import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { WorkshopStatus } from '../enums/workshop-status.enum.js';

@Entity('workshops')
export class Workshop extends BaseEntity {
  @ApiProperty({ example: 'Taller Central' })
  @Column({ length: 120 })
  nombre: string;

  @ApiProperty({ example: 'Calle 10 # 20-30, Medellín' })
  @Column({ type: 'text' })
  direccion: string;

  @ApiProperty({ enum: WorkshopStatus })
  @Column({
    type: 'simple-enum',
    enum: WorkshopStatus,
    default: WorkshopStatus.ACTIVE,
  })
  estado: WorkshopStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.taller)
  maintenances: Relation<Maintenance[]>;
}
