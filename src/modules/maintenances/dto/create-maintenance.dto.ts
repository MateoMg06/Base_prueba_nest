import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';
import { MaintenanceType } from '../enums/maintenance-type.enum.js';

// El estado no se envía: todo mantenimiento nuevo empieza SCHEDULED
export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  tipo: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    example: 45200,
    description: 'Kilometraje del vehículo al ingresar',
  })
  @IsInt()
  @Min(0)
  kilometraje: number;

  @ApiProperty({ example: '2026-11-02T07:30:00-05:00' })
  @IsDateString()
  fechaProgramada: string;

  @ApiProperty({ example: 90, description: 'Duración estimada en minutos' })
  @IsInt()
  @Min(15)
  @Max(1440)
  duracionEstimadaMinutos: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  vehiculoId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  mecanicoId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  tallerId: number;
}
