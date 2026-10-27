import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Role } from '../../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

// Login con GitHub (OAuth 2.0). Al final entrega el mismo JWT del login normal.
@Injectable()
export class GithubService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // URL de GitHub a la que se redirige al usuario para que autorice la app
  async getLoginUrl() {
    const github = this.getConfig();
    // El state evita que alguien nos envíe un callback que no iniciamos.
    // Se firma con el secreto de GitHub para que no sirva como token de la API.
    const state = await this.jwtService.signAsync(
      { github: true },
      { secret: github.clientSecret, expiresIn: 600 },
    );
    const params = new URLSearchParams({
      client_id: github.clientId,
      redirect_uri: github.callbackUrl,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async login(code: string, state: string) {
    const github = this.getConfig();
    try {
      await this.jwtService.verifyAsync(state, { secret: github.clientSecret });
    } catch {
      throw new UnauthorizedException(
        'El parámetro state es inválido o expiró',
      );
    }

    const githubToken = await this.getGithubToken(code);
    const profile = await this.githubGet<{
      login: string;
      name: string | null;
    }>('/user', githubToken);
    const emails = await this.githubGet<GithubEmail[]>(
      '/user/emails',
      githubToken,
    );
    // Solo confiamos en el correo principal y verificado
    const mainEmail = emails.find((item) => item.primary && item.verified);
    if (!mainEmail) {
      throw new UnauthorizedException(
        'Tu cuenta de GitHub no tiene un correo principal verificado',
      );
    }

    const email = mainEmail.email.toLowerCase();
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // Usuario nuevo: entra como TECHNICIAN con una contraseña aleatoria
      // (solo podrá entrar con GitHub hasta que se le asigne una).
      const password = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      user = await this.usersService.create({
        nombre: profile.name || profile.login,
        email,
        passwordHash: password,
        role: Role.TECHNICIAN,
      });
    }
    return this.authService.createToken(user);
  }

  // Cambia el code temporal por un token de acceso de GitHub
  private async getGithubToken(code: string) {
    const github = this.getConfig();
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: github.clientId,
          client_secret: github.clientSecret,
          code,
          redirect_uri: github.callbackUrl,
        }),
      },
    );
    const data = (await response.json()) as { access_token?: string };
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException('GitHub rechazó el código de acceso');
    }
    return data.access_token;
  }

  private async githubGet<T>(path: string, token: string) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'FleetCore',
      },
    });
    if (!response.ok) {
      throw new UnauthorizedException('No se pudo leer el perfil de GitHub');
    }
    return (await response.json()) as T;
  }

  private getConfig() {
    const clientId = this.configService.get<string>('github.clientId');
    const clientSecret = this.configService.get<string>('github.clientSecret');
    const callbackUrl = this.configService.get<string>('github.callbackUrl');
    if (!clientId || !clientSecret || !callbackUrl) {
      throw new ServiceUnavailableException(
        'El login con GitHub no está configurado (GITHUB_* en .env)',
      );
    }
    return { clientId, clientSecret, callbackUrl };
  }
}
