import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { ErrorResponseDto } from '../dto/error-response.dto.js';
import { statusCodeToWords } from '../utils/status-code-words.util.js';

/**
 * Normaliza TODOS los errores:
 * { success: false, statusCode, statusCodeInWords, error, message, path, method, timestamp }
 *
 * - HttpException (400, 401, 403, 404, 409...) conserva su código real.
 * - Errores conocidos de TypeORM se traducen a 404/409 en vez de 500.
 * - Solo lo realmente inesperado responde 500 (y se registra en el log).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseDto = {
      success: false,
      statusCode,
      statusCodeInWords: statusCodeToWords(statusCode),
      error: (HttpStatus[statusCode] as string | undefined) ?? 'ERROR',
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            exception.message);
      return { statusCode: exception.getStatus(), message };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Recurso no encontrado',
      };
    }

    if (exception instanceof QueryFailedError) {
      if (/unique|duplicate/i.test(exception.message)) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'El registro ya existe',
        };
      }
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Operación inválida sobre la base de datos',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }
}
