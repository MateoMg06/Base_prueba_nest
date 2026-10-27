import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isPublicRoute } from '../utils/is-public.util.js';

/**
 * Guard 1/2 – Autenticación extensible (JWT, Better Auth, OAuth2).
 * Se registra globalmente: toda ruta exige token salvo las marcadas con @Public().
 *
 * Pendiente (fase de autenticación): verificar el Bearer token, cargar el usuario
 * y adjuntarlo a request.user. Mientras tanto rechaza toda ruta privada (falla cerrado).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isPublicRoute(this.reflector, context)) return true;

    throw new UnauthorizedException('Token ausente, inválido o expirado');
  }
}
