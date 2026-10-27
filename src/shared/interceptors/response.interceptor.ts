import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../common/interfaces/api-response.interface.js';

/**
 * Envuelve toda respuesta exitosa en:
 * { success: true, statusCode, data, timestamp }
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode,
        data: data ?? (null as T),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
