import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/** Documenta un listado paginado: { success, statusCode, data: { items, total, page, limit } }. */
export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          statusCodeInWords: { type: 'string', example: 'dos cero cero' },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: getSchemaPath(model) } },
              total: { type: 'number', example: 4 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
            },
          },
          timestamp: { type: 'string', example: '2026-10-27T12:00:00.000Z' },
        },
      },
    }),
  );
