import { Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum.js';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { USERS } from './data/users.data.js';

/**
 * Fuente de usuarios. Hoy es memoria; si la prueba pide persistirlos,
 * reemplaza la implementación por un Repository<User> sin tocar los guards.
 */
@Injectable()
export class UsersService {
  private readonly users = new Map(USERS.map((u) => [u.username, u]));

  findByUsername(username: string): AuthenticatedUser | undefined {
    return this.users.get(username);
  }

  findAll(): AuthenticatedUser[] {
    return [...this.users.values()];
  }

  isRole(username: string, role: Role): boolean {
    return this.findByUsername(username)?.role === role;
  }
}
