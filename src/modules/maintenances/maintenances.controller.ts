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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesService } from './maintenances.service.js';

@ApiTags('Mantenimientos')
@ApiBearerAuth()
@ApiCommonErrors()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear mantenimiento (empieza SCHEDULED)' })
  @ApiWrappedResponse(Maintenance, { status: HttpStatus.CREATED })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    description:
      'Vehículo/mecánico/taller inactivo, mantenimiento activo o cruce de horario',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos (paginado)' })
  @ApiOkResponse({
    description: 'Lista paginada: { items, total, page, limit }',
  })
  findAll(@Query() query: MaintenanceQueryDto) {
    return this.maintenancesService.findAll(query);
  }

  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos activos (SCHEDULED o IN_PROGRESS)' })
  @ApiWrappedResponse(Maintenance, { isArray: true })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('mine')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Mantenimientos asignados al técnico logueado' })
  @ApiWrappedResponse(Maintenance, { isArray: true })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.maintenancesService.findMine(user);
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos de un vehículo' })
  @ApiWrappedResponse(Maintenance, { isArray: true })
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Historial (mantenimientos COMPLETED) de un vehículo',
  })
  @ApiWrappedResponse(Maintenance, { isArray: true })
  findVehicleHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findVehicleHistory(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico' })
  @ApiWrappedResponse(Maintenance, { isArray: true })
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Detalle (el técnico solo ve los suyos)' })
  @ApiWrappedResponse(Maintenance)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenancesService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Cambiar estado',
    description:
      'SCHEDULED → IN_PROGRESS | CANCELLED; IN_PROGRESS → COMPLETED | CANCELLED. ' +
      'Para COMPLETED envía trabajoRealizado, costoFinal, fechaFinalizacion y kilometrajeFinal.',
  })
  @ApiWrappedResponse(Maintenance)
  @ApiConflictResponse({
    description: 'Transición inválida',
    type: ErrorResponseDto,
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}
