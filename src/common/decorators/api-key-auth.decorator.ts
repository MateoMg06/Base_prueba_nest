import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto.js';
import { ApiKeyGuard } from '../guards/api-key.guard.js';
import { Public } from './public.decorator.js';

/**
 * Protege un endpoint de integración externa SOLO con x-api-key:
 * lo excluye del JWT (@Public), aplica ApiKeyGuard y lo documenta en Swagger.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    Public(),
    UseGuards(ApiKeyGuard),
    ApiSecurity('api-key'),
    ApiUnauthorizedResponse({
      description: 'x-api-key ausente o inválida',
      type: ErrorResponseDto,
    }),
  );
