import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/metadata.constants.js';
import { Role } from '../enums/role.enum.js';
import { RolesGuard } from './roles.guard.js';

const contextWith = (user?: object) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let isPublic: boolean;
  let roles: Role[] | undefined;
  let guard: RolesGuard;

  beforeEach(() => {
    isPublic = false;
    roles = [Role.ADMIN];
    const reflector = {
      getAllAndOverride: (key: string) =>
        key === ROLES_KEY ? roles : isPublic,
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('permite al usuario con el rol pedido', () => {
    expect(guard.canActivate(contextWith({ role: Role.ADMIN }))).toBe(true);
  });

  it('rechaza con 403 al usuario sin el rol', () => {
    expect(() =>
      guard.canActivate(contextWith({ role: Role.TECHNICIAN })),
    ).toThrow(ForbiddenException);
  });

  it('sin roles declarados basta con estar identificado', () => {
    roles = undefined;
    expect(guard.canActivate(contextWith({ role: Role.TECHNICIAN }))).toBe(
      true,
    );
  });

  it('las rutas públicas no revisan roles', () => {
    isPublic = true;
    expect(guard.canActivate(contextWith())).toBe(true);
  });
});
