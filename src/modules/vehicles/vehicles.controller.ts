import {
  Body,
  Controller,
  Delete,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../../common/decorators/api-error-responses.decorator.js';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator.js';
import { ApiWrappedResponse } from '../../common/decorators/api-wrapped-response.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleQueryDto } from './dto/vehicle-query.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';

/** Gestión de la flota: escritura solo ADMIN; consulta ADMIN y MANAGER. */
@ApiTags('Vehículos')
@ApiBearerAuth()
@ApiCommonErrors()
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar vehículo (nace AVAILABLE)' })
  @ApiWrappedResponse(Vehicle, { status: HttpStatus.CREATED })
  @ApiConflictResponse({
    description: 'Placa duplicada',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos (paginado, filtro por estado)' })
  @ApiPaginatedResponse(Vehicle)
  findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get('plate/:placa')
  @ApiOperation({ summary: 'Consultar vehículo por placa' })
  @ApiWrappedResponse(Vehicle)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findByPlate(@Param('placa') placa: string) {
    return this.vehiclesService.findByPlate(placa);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar vehículo por id' })
  @ApiWrappedResponse(Vehicle)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos del vehículo' })
  @ApiWrappedResponse(Vehicle)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Placa duplicada',
    type: ErrorResponseDto,
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Inactivar vehículo (eliminación lógica, conserva historial)',
  })
  @ApiWrappedResponse(Vehicle)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Tiene mantenimientos activos',
    type: ErrorResponseDto,
  })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivar vehículo INACTIVE (queda AVAILABLE)' })
  @ApiWrappedResponse(Vehicle)
  @ApiConflictResponse({
    description: 'No está INACTIVE',
    type: ErrorResponseDto,
  })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.activate(id);
  }
}
