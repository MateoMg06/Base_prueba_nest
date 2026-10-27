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

// Guard global: toda ruta pide "Authorization: Bearer <token>" salvo las @Public().
// Sin token, token inválido o expirado -> 401.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.getToken(request);

    // En rutas públicas el token es opcional (lo usa /auth/register para
    // saber si quien registra es ADMIN).
    if (isPublicRoute(this.reflector, context)) {
      if (token) {
        request.user = await this.verifyToken(token).catch(() => undefined);
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso (Bearer)');
    }
    request.user = await this.verifyToken(token);
    return true;
  }

  private async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('El token es inválido o ha expirado');
    }
  }

  private getToken(request: RequestWithUser) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
