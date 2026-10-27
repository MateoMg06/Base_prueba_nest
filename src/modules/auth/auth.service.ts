import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Role } from '../../common/enums/role.enum.js';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/interfaces/authenticated-user.interface.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthTokenDto, AuthUserDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Registro abierto para TECHNICIAN. Crear ADMIN o MANAGER exige que quien
   * registra sea un ADMIN autenticado, para que nadie se autoasigne privilegios.
   */
  async register(
    dto: RegisterDto,
    requester?: AuthenticatedUser,
  ): Promise<AuthUserDto> {
    const role = dto.role ?? Role.TECHNICIAN;
    if (role !== Role.TECHNICIAN && requester?.role !== Role.ADMIN) {
      throw new ForbiddenException(
        `Solo un ADMIN autenticado puede registrar usuarios ${role}`,
      );
    }

    const user = await this.usersService.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
      role,
    });
    return this.toAuthUser(user);
  }

  /** Mismo mensaje para correo inexistente y contraseña errónea: no revela cuentas. */
  async login(dto: LoginDto): Promise<AuthTokenDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid =
      user?.passwordHash !== undefined &&
      (await argon2.verify(user.passwordHash, dto.password));
    if (!user || !valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.issueToken(user);
  }

  async issueToken(user: User): Promise<AuthTokenDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.config.getOrThrow<number>('jwt.expiresIn'),
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser({ id, nombre, email, role }: User): AuthUserDto {
    return { id, nombre, email, role };
  }
}
