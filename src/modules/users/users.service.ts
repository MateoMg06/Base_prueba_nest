import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // Trae también el hash de la contraseña (por defecto no se selecciona)
  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(data: Partial<User>) {
    const exists = await this.userRepository.existsBy({ email: data.email });
    if (exists) {
      throw new ConflictException(`El correo ${data.email} ya está registrado`);
    }
    return this.userRepository.save(this.userRepository.create(data));
  }
}
