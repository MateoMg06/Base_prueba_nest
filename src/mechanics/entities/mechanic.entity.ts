import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Maintenance } from '../../maintenances/entities/maintenance.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { MechanicStatus } from '../enums/mechanic-status.enum.js';

@Entity('mechanics')
export class Mechanic extends BaseEntity {
  @Column({ length: 120 })
  nombre: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  correo: string;

  @Column({ length: 120 })
  especialidad: string;

  @Column({
    type: 'simple-enum',
    enum: MechanicStatus,
    default: MechanicStatus.ACTIVE,
  })
  estado: MechanicStatus;

  @OneToOne(() => User, (user) => user.mechanic, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  usuario?: User | null;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.mecanico)
  maintenances: Maintenance[];
}
