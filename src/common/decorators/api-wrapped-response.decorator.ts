import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Documenta en Swagger una respuesta exitosa con el sobre del ResponseInterceptor:
 * { success, statusCode, data: <model | model[]>, timestamp }
 *
 * @example @ApiWrappedResponse(Solicitud, { status: 201, description: 'Creada' })
 * @example @ApiWrappedResponse(Solicitud, { isArray: true })
 */
export const ApiWrappedResponse = <T extends Type<unknown>>(
  model: T,
  options: {
    status?: HttpStatus;
    description?: string;
    isArray?: boolean;
  } = {},
) => {
  const { status = HttpStatus.OK, description, isArray = false } = options;
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: status },
          data: dataSchema,
          timestamp: { type: 'string', example: '2026-10-26T12:00:00.000Z' },
        },
      },
    }),
  );
};
