import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { User } from './entities/user.entity.js';

export interface CreateUserData {
  nombre: string;
  email: string;
  passwordHash: string;
  role: Role;
}

/** Acceso a usuarios persistidos. El hash nunca se selecciona por defecto. */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Incluye passwordHash: úsalo solo para verificar credenciales. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(data: CreateUserData): Promise<User> {
    if (await this.users.existsBy({ email: data.email })) {
      throw new ConflictException(`El correo ${data.email} ya está registrado`);
    }
    const { passwordHash: _hash, ...user } = await this.users.save(
      this.users.create(data),
    );
    return user as User;
  }
}
