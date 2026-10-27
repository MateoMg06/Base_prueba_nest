import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { MechanicStatus } from '../enums/mechanic-status.enum.js';

@Entity('mechanics')
export class Mechanic extends BaseEntity {
  @ApiProperty({ example: 'Carlos Pérez' })
  @Column({ length: 120 })
  nombre: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @Index({ unique: true })
  @Column({ length: 150 })
  correo: string;

  @ApiProperty({ example: 'Motores diésel' })
  @Column({ length: 120 })
  especialidad: string;

  @ApiProperty({ enum: MechanicStatus })
  @Column({
    type: 'simple-enum',
    enum: MechanicStatus,
    default: MechanicStatus.ACTIVE,
  })
  estado: MechanicStatus;

  @ApiPropertyOptional({
    description: 'Usuario TECHNICIAN vinculado (id, nombre, email, role)',
    nullable: true,
  })
  @OneToOne(() => User, (user) => user.mechanic, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  usuario?: Relation<User> | null;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.mecanico)
  maintenances: Relation<Maintenance[]>;
}
