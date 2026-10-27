import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../../common/decorators/api-error-responses.decorator.js';
import { ApiWrappedResponse } from '../../common/decorators/api-wrapped-response.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { MechanicQueryDto } from './dto/mechanic-query.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsService } from './mechanics.service.js';

/** Gestión de mecánicos: exclusiva del ADMIN. */
@ApiTags('Mecánicos')
@ApiBearerAuth()
@ApiCommonErrors()
@Roles(Role.ADMIN)
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar mecánico (nace ACTIVE)' })
  @ApiWrappedResponse(Mechanic, { status: HttpStatus.CREATED })
  @ApiConflictResponse({
    description: 'Correo duplicado o usuario ya vinculado',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mecánicos (paginado, filtro por estado)' })
  @ApiOkResponse({
    description: 'Lista paginada: { items, total, page, limit }',
  })
  findAll(@Query() query: MechanicQueryDto) {
    return this.mechanicsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un mecánico' })
  @ApiWrappedResponse(Mechanic)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos del mecánico' })
  @ApiWrappedResponse(Mechanic)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMechanicDto,
  ) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Inactivar mecánico (conserva su historial)' })
  @ApiWrappedResponse(Mechanic)
  @ApiConflictResponse({
    description: 'Tiene mantenimientos activos',
    type: ErrorResponseDto,
  })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar mecánico' })
  @ApiWrappedResponse(Mechanic)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.activate(id);
  }
}
