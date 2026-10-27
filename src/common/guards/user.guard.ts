import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_HEADER } from '../constants/headers.constants.js';
import { RequestWithUser } from '../interfaces/authenticated-user.interface.js';
import { headerValue, isPublicRoute } from '../utils/is-public.util.js';
import { UsersService } from '../../modules/users/users.service.js';

/**
 * Guard 2/3 – Identifica al usuario a partir de x-user.
 * El rol SIEMPRE se toma del registro en memoria, nunca de lo que envíe el cliente.
 */
@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (isPublicRoute(this.reflector, context)) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const username = headerValue(request.headers[USER_HEADER]);

    if (!username) {
      throw new UnauthorizedException(`Falta el encabezado ${USER_HEADER}`);
    }

    const user = this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException(`El usuario "${username}" no existe`);
    }

    request.user = user;
    return true;
  }
}
