import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard.js';

const contextWith = (headers: Record<string, string>) =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

describe('ApiKeyGuard', () => {
  const config = { get: () => ['k1', 'k2'] } as unknown as ConfigService;
  const guard = new ApiKeyGuard(new Reflector(), config);

  it('acepta cualquiera de las claves configuradas', () => {
    expect(guard.canActivate(contextWith({ 'x-api-key': 'k1' }))).toBe(true);
    expect(guard.canActivate(contextWith({ 'x-api-key': 'k2' }))).toBe(true);
  });

  it('rechaza clave ausente o inválida', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(contextWith({ 'x-api-key': 'k3' }))).toThrow(
      UnauthorizedException,
    );
  });
});
