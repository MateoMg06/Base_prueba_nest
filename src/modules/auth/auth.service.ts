import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum.js';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Cualquiera puede registrarse como TECHNICIAN; para crear un ADMIN
  // hay que estar logueado como ADMIN.
  async register(dto: RegisterDto, currentUser?: AuthenticatedUser) {
    const role = dto.role ?? Role.TECHNICIAN;
    if (role === Role.ADMIN && currentUser?.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo un ADMIN puede registrar otro ADMIN');
    }

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: password,
      role,
    });
    return this.toUserResponse(user);
  }

  // Mismo mensaje si el correo no existe o la contraseña es incorrecta
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.createToken(user);
  }

  async createToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.configService.get<number>('jwt.expiresIn'),
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
    };
  }
}
