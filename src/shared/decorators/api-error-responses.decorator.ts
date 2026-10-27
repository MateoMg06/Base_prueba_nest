import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';

/** Documenta en Swagger los errores comunes a todos los endpoints protegidos. */
export const ApiCommonErrors = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Datos inválidos',
      type: ErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'x-api-key ausente/inválida o x-user ausente/inexistente',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'El rol del usuario no tiene permiso',
      type: ErrorResponseDto,
    }),
  );
