import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { UsersService } from '../users/users.service.js';
import { Solicitud } from './entities/solicitud.entity.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import {
  ESTADO_INICIAL,
  esTransicionValida,
  TRANSICIONES_PERMITIDAS,
} from './constants/transiciones.constants.js';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly repo: Repository<Solicitud>,
    private readonly usersService: UsersService,
  ) {}

  /** RN-01 */
  async create(
    dto: CreateSolicitudDto,
    user: AuthenticatedUser,
  ): Promise<Solicitud> {
    const solicitud = this.repo.create({
      cliente: dto.cliente,
      descripcion: dto.descripcion,
      asesor: this.resolveAsesor(dto, user),
      estado: ESTADO_INICIAL, // siempre, sin importar lo que envíe el cliente
    });
    return this.repo.save(solicitud);
  }

  /** RN-02: el filtro del asesor viaja en el WHERE de la consulta SQL. */
  findAll(user: AuthenticatedUser): Promise<Solicitud[]> {
    return this.repo.find({
      where: this.scopeFor(user),
      order: { id: 'DESC' },
    });
  }

  /**
   * RN-02 en consulta individual: el asesor solo "ve" las suyas.
   * Una solicitud ajena responde 404 (igual que una inexistente) para no revelar
   * que el id existe. Si la prueba pide 403, ver README › "Decisiones".
   */
  async findOne(id: number, user: AuthenticatedUser): Promise<Solicitud> {
    const solicitud = await this.repo.findOne({
      where: { id, ...this.scopeFor(user) },
    });
    if (!solicitud) {
      throw new NotFoundException(`La solicitud ${id} no existe`);
    }
    return solicitud;
  }

  /** RN-03 */
  async updateEstado(
    id: number,
    { estado }: UpdateEstadoDto,
    user: AuthenticatedUser,
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id, user); // aplica la propiedad del asesor

    if (!esTransicionValida(solicitud.estado, estado)) {
      const permitidos = TRANSICIONES_PERMITIDAS[solicitud.estado];
      throw new ConflictException(
        `No se puede cambiar de ${solicitud.estado} a ${estado}. ` +
          (permitidos.length
            ? `Transición permitida: ${solicitud.estado} → ${permitidos.join(', ')}`
            : `${solicitud.estado} es un estado final`),
      );
    }

    solicitud.estado = estado;
    return this.repo.save(solicitud);
  }

  /** Filtro de propiedad: admin/supervisor ven todo, asesor solo lo suyo. */
  private scopeFor(user: AuthenticatedUser): FindOptionsWhere<Solicitud> {
    return user.role === Role.ASESOR ? { asesor: user.username } : {};
  }

  private resolveAsesor(
    dto: CreateSolicitudDto,
    user: AuthenticatedUser,
  ): string {
    if (user.role === Role.ASESOR) return user.username;

    if (!dto.asesor) {
      throw new BadRequestException(
        'asesor es obligatorio cuando registra un admin o supervisor',
      );
    }
    if (!this.usersService.isRole(dto.asesor, Role.ASESOR)) {
      throw new BadRequestException(`"${dto.asesor}" no es un asesor válido`);
    }
    return dto.asesor;
  }
}
