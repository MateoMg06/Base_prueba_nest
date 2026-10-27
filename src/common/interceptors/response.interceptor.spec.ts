import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  const context = {
    switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }),
  } as unknown as ExecutionContext;

  it('envuelve la respuesta en { success, statusCode, data, timestamp }', async () => {
    const next: CallHandler = { handle: () => of({ id: 1 }) };
    const result = await firstValueFrom(
      new ResponseInterceptor().intercept(context, next),
    );
    expect(result).toMatchObject({
      success: true,
      statusCode: 201,
      data: { id: 1 },
    });
    expect(typeof result.timestamp).toBe('string');
  });

  it('usa null cuando el controlador no devuelve nada', async () => {
    const next: CallHandler = { handle: () => of(undefined) };
    const result = await firstValueFrom(
      new ResponseInterceptor().intercept(context, next),
    );
    expect(result.data).toBeNull();
  });
});
