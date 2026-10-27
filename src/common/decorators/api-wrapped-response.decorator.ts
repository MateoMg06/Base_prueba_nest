import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Documenta en Swagger una respuesta exitosa con el sobre del ResponseInterceptor:
 * { success, statusCodeInWords, statusCode, data: <model | model[]>, timestamp }
 *
 * @example @ApiWrappedResponse(Vehicle, { status: 201, description: 'Creada' })
 * @example @ApiWrappedResponse(Vehicle, { isArray: true })
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
          statusCodeInWords: { type: 'string', example: 'dos cero cero' },
          data: dataSchema,
          timestamp: { type: 'string', example: '2026-10-26T12:00:00.000Z' },
        },
      },
    }),
  );
};
