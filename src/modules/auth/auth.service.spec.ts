import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Role } from '../../common/enums/role.enum.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const jwtService = new JwtService({ secret: 'x'.repeat(32) });
  const config = { getOrThrow: () => 3600 } as unknown as ConfigService;
  let users: {
    create: ReturnType<typeof vi.fn>;
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: vi.fn((data: Partial<User>) =>
        Promise.resolve({ id: 7, ...data } as User),
      ),
      findByEmailWithPassword: vi.fn(),
    };
    service = new AuthService(
      users as unknown as UsersService,
      jwtService,
      config,
    );
  });

  it('registra TECHNICIAN por defecto y guarda la contraseña con argon2', async () => {
    const user = await service.register({
      nombre: 'Ana',
      email: 'ana@fleetcore.com',
      password: 'Secreta123',
    });

    const { passwordHash } = users.create.mock.calls[0][0] as User;
    expect(user).toEqual({
      id: 7,
      nombre: 'Ana',
      email: 'ana@fleetcore.com',
      role: Role.TECHNICIAN,
    });
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    await expect(argon2.verify(passwordHash, 'Secreta123')).resolves.toBe(true);
  });

  it('impide que alguien sin rol ADMIN registre un ADMIN', async () => {
    const dto = {
      nombre: 'X',
      email: 'x@fleetcore.com',
      password: 'Secreta123',
      role: Role.ADMIN,
    };
    await expect(service.register(dto)).rejects.toThrow(ForbiddenException);
    await expect(
      service.register(dto, { id: 1, email: 'a@a.co', role: Role.ADMIN }),
    ).resolves.toMatchObject({ role: Role.ADMIN });
  });

  it('emite un JWT verificable con el rol del usuario al iniciar sesión', async () => {
    users.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      nombre: 'Admin',
      email: 'admin@fleetcore.com',
      role: Role.ADMIN,
      passwordHash: await argon2.hash('Admin123*'),
    });

    const result = await service.login({
      email: 'admin@fleetcore.com',
      password: 'Admin123*',
    });
    const payload = await jwtService.verifyAsync<{ sub: number; role: Role }>(
      result.accessToken,
    );
    expect(payload).toMatchObject({ sub: 1, role: Role.ADMIN });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('responde 401 genérico con contraseña errónea o correo inexistente', async () => {
    users.findByEmailWithPassword.mockResolvedValue(null);
    await expect(
      service.login({ email: 'no@fleetcore.com', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
