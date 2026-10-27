import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { API_KEY_HEADER } from '../constants/headers.constants.js';
import { headerValue } from '../utils/is-public.util.js';

/**
 * Valida x-api-key contra la lista API_KEYS del entorno.
 * NO es global: se aplica solo a endpoints de integración externa, junto con
 * @Public() para que no exijan JWT:
 *
 * @example @Public() @UseGuards(ApiKeyGuard) @Get('integrations/vehicles')
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKeys: Buffer[];

  constructor(config: ConfigService) {
    this.apiKeys = (config.get<string[]>('apiKeys') ?? []).map((key) =>
      Buffer.from(key),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = headerValue(request.headers[API_KEY_HEADER]);

    if (!apiKey) {
      throw new UnauthorizedException(`Falta el encabezado ${API_KEY_HEADER}`);
    }
    if (!this.isValid(apiKey)) {
      throw new UnauthorizedException(`El ${API_KEY_HEADER} es inválido`);
    }
    return true;
  }

  /** Comparación en tiempo constante para no filtrar información por timing. */
  private isValid(candidate: string): boolean {
    const input = Buffer.from(candidate);
    return this.apiKeys.some(
      (key) => key.length === input.length && timingSafeEqual(key, input),
    );
  }
}
