import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiCommonErrors } from '../../common/decorators/api-error-responses.decorator.js';
import { ApiWrappedResponse } from '../../common/decorators/api-wrapped-response.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { SolicitudesService } from './solicitudes.service.js';
import { CreateSolicitudDto } from './dto/create-solicitud.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';
import { Solicitud } from './entities/solicitud.entity.js';

/**
 * Controlador delgado: solo HTTP + documentación. Las reglas viven en el servicio.
 * @Roles a nivel de clase = los 3 roles pueden entrar; la propiedad del asesor
 * se valida en el servicio (depende del registro, no solo del rol).
 */
@ApiTags('Solicitudes')
@ApiCommonErrors()
@Roles(Role.ADMIN, Role.SUPERVISOR, Role.ASESOR)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una solicitud',
    description:
      'Estado inicial siempre PENDIENTE. Si quien registra es asesor, queda como responsable.',
  })
  @ApiWrappedResponse(Solicitud, {
    status: HttpStatus.CREATED,
    description: 'Solicitud creada',
  })
  create(
    @Body() dto: CreateSolicitudDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.solicitudesService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar solicitudes permitidas',
    description:
      'admin y supervisor ven todas; asesor solo las suyas (filtrado en la BD).',
  })
  @ApiWrappedResponse(Solicitud, {
    isArray: true,
    description: 'Listado de solicitudes',
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.solicitudesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una solicitud' })
  @ApiParam({ name: 'id', type: Number })
  @ApiWrappedResponse(Solicitud, { description: 'Solicitud encontrada' })
  @ApiNotFoundResponse({
    description: 'No existe o no pertenece al asesor',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.solicitudesService.findOne(id, user);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.ASESOR) // ejemplo de @Roles por endpoint
  @ApiOperation({
    summary: 'Cambiar el estado',
    description: 'Transiciones válidas: PENDIENTE → EN_GESTION → RESUELTA.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiWrappedResponse(Solicitud, { description: 'Estado actualizado' })
  @ApiNotFoundResponse({
    description: 'No existe o no pertenece al asesor',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Transición de estado inválida',
    type: ErrorResponseDto,
  })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.solicitudesService.updateEstado(id, dto, user);
  }
}
