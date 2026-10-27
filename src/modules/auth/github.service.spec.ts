import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { GithubService } from './github.service.js';

// Respuesta falsa de fetch
const reply = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe('GithubService', () => {
  let config: Record<string, string | undefined>;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };
  let authService: { createToken: jest.Mock };
  let fetchMock: jest.Mock;
  let service: GithubService;
  const jwtService = new JwtService({ secret: 'secreto-de-prueba' });

  beforeEach(() => {
    config = {
      'github.clientId': 'client-id',
      'github.clientSecret': 'client-secret-de-prueba',
      'github.callbackUrl': 'http://localhost:3000/auth/github/callback',
    };
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: object) => Promise.resolve({ id: 5, ...data })),
    };
    authService = {
      createToken: jest.fn().mockResolvedValue({ accessToken: 'jwt' }),
    };
    fetchMock = jest
      .fn()
      .mockReturnValueOnce(reply({ access_token: 'gh-token' }))
      .mockReturnValueOnce(reply({ login: 'mateo', name: 'Mateo' }))
      .mockReturnValueOnce(
        reply([
          { email: 'otro@mail.com', primary: false, verified: true },
          { email: 'Mateo@Mail.com', primary: true, verified: true },
        ]),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    service = new GithubService(
      { get: (key: string) => config[key] } as unknown as ConfigService,
      jwtService,
      usersService as unknown as UsersService,
      authService as unknown as AuthService,
    );
  });

  it('arma la URL de GitHub con client_id, callback y state', async () => {
    const url = new URL(await service.getLoginUrl());
    expect(url.origin).toBe('https://github.com');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/auth/github/callback',
    );
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('sin variables GITHUB_* responde 503', async () => {
    config['github.clientId'] = undefined;
    await expect(service.getLoginUrl()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('crea un TECHNICIAN con el correo principal y entrega el JWT', async () => {
    const state = new URL(await service.getLoginUrl()).searchParams.get(
      'state',
    )!;
    await expect(service.login('code', state)).resolves.toEqual({
      accessToken: 'jwt',
    });
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Mateo',
        email: 'mateo@mail.com',
        role: Role.TECHNICIAN,
      }),
    );
  });

  it('si el correo ya existe usa ese usuario', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 1, role: Role.ADMIN });
    const state = new URL(await service.getLoginUrl()).searchParams.get(
      'state',
    )!;
    await service.login('code', state);
    expect(usersService.create).not.toHaveBeenCalled();
    expect(authService.createToken).toHaveBeenCalledWith({
      id: 1,
      role: Role.ADMIN,
    });
  });

  it('rechaza un state inválido sin llamar a GitHub', async () => {
    await expect(service.login('code', 'state-falso')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza si GitHub no entrega el token', async () => {
    fetchMock.mockReset().mockReturnValueOnce(reply({ error: 'bad' }));
    const state = new URL(await service.getLoginUrl()).searchParams.get(
      'state',
    )!;
    await expect(service.login('code', state)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
