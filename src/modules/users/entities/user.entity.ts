import { Column, Entity, Index, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Role } from '../../../common/enums/role.enum.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 120 })
  nombre: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({
    type: 'simple-enum',
    enum: Role,
    default: Role.TECHNICIAN,
  })
  role: Role;

  @OneToOne(() => Mechanic, (mechanic) => mechanic.usuario)
  mechanic?: Relation<Mechanic>;
}
