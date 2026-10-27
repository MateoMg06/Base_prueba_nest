import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { VehicleStatus } from '../enums/vehicle-status.enum.js';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @ApiProperty({ example: 'ABC123' })
  @Index({ unique: true })
  @Column({ length: 15 })
  placa: string;

  @ApiProperty({ example: 'Chevrolet' })
  @Column({ length: 80 })
  marca: string;

  @ApiProperty({ example: 'NHR' })
  @Column({ length: 80 })
  modelo: string;

  @ApiProperty({ example: 2022 })
  @Column({ type: 'int' })
  anio: number;

  @ApiProperty({ example: 45000 })
  @Column({ type: 'int', default: 0 })
  kilometraje: number;

  @ApiProperty({ enum: VehicleStatus })
  @Column({
    type: 'simple-enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  estado: VehicleStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.vehiculo)
  maintenances: Relation<Maintenance[]>;
}
