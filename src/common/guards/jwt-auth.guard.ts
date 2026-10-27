import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  JwtPayload,
  RequestWithUser,
} from '../interfaces/authenticated-user.interface.js';
import { isPublicRoute } from '../utils/is-public.util.js';

/**
 * Guard 1/2 – Autenticación por JWT (Authorization: Bearer <token>).
 * Registrado globalmente: toda ruta exige token salvo las marcadas con @Public().
 *
 * - Sin token, token mal formado, firma inválida o expirado → 401.
 * - En rutas públicas el token es opcional: si llega y es válido se adjunta
 *   request.user (p. ej. un ADMIN registrando a otro ADMIN); si no, se ignora.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (isPublicRoute(this.reflector, context)) {
      if (token) request.user = await this.verify(token).catch(() => undefined);
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso (Bearer)');
    }
    request.user = await this.verify(token);
    return true;
  }

  private async verify(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('El token es inválido o ha expirado');
    }
  }

  private extractBearerToken(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : undefined;
  }
}
