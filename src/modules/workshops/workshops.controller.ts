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
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopQueryDto } from './dto/workshop-query.dto.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopsService } from './workshops.service.js';

// Gestión de talleres: el ADMIN administra; el técnico puede consultar
// los talleres activos y el detalle de uno.
@ApiTags('Talleres')
@ApiBearerAuth()
@ApiCommonErrors()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar taller (nace ACTIVE)' })
  @ApiWrappedResponse(Workshop, { status: HttpStatus.CREATED })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los talleres (paginado)' })
  @ApiOkResponse({
    description: 'Lista paginada: { items, total, page, limit }',
  })
  findAll(@Query() query: WorkshopQueryDto) {
    return this.workshopsService.findAll(query);
  }

  @Get('active')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Listar talleres activos' })
  @ApiWrappedResponse(Workshop, { isArray: true })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un taller' })
  @ApiWrappedResponse(Workshop)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar taller' })
  @ApiWrappedResponse(Workshop)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar taller' })
  @ApiWrappedResponse(Workshop)
  @ApiConflictResponse({
    description: 'Tiene mantenimientos activos',
    type: ErrorResponseDto,
  })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar taller' })
  @ApiWrappedResponse(Workshop)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.activate(id);
  }
}
