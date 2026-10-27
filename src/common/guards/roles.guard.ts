import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/metadata.constants.js';
import { Role } from '../enums/role.enum.js';
import { RequestWithUser } from '../interfaces/authenticated-user.interface.js';
import { isPublicRoute } from '../utils/is-public.util.js';

/**
 * Guard 3/3 – Aplica los roles declarados con @Roles(...).
 * Si el endpoint no declara roles, basta con estar identificado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isPublicRoute(this.reflector, context)) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Requiere uno de los roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
