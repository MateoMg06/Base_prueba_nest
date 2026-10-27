import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../enums/role.enum.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const contextWith = (request: object) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let isPublic: boolean;
  let jwtService: { verifyAsync: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    isPublic = false;
    const reflector = { getAllAndOverride: () => isPublic };
    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 1,
        email: 'admin@fleetcore.com',
        role: Role.ADMIN,
      }),
    };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as JwtService,
    );
  });

  it('con token válido guarda el usuario en la petición', async () => {
    const request = { headers: { authorization: 'Bearer abc' } } as {
      headers: object;
      user?: object;
    };
    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 1,
      email: 'admin@fleetcore.com',
      role: Role.ADMIN,
    });
  });

  it('sin token responde 401', async () => {
    await expect(
      guard.canActivate(contextWith({ headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('con token inválido o expirado responde 401', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'Bearer malo' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('en rutas públicas deja pasar aunque el token sea inválido', async () => {
    isPublic = true;
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));
    const request = { headers: { authorization: 'Bearer malo' } } as {
      headers: object;
      user?: object;
    };
    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});
