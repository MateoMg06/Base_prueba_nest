import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { MaintenanceStatus } from '../enums/maintenance-status.enum.js';

// Para pasar a COMPLETED son obligatorios los 4 datos de cierre
const isCompleting = (dto: UpdateStatusDto) =>
  dto.estado === MaintenanceStatus.COMPLETED;

export class UpdateStatusDto {
  @ApiProperty({ enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  estado: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'Se cambió aceite y filtro de aire' })
  @ValidateIf(isCompleting)
  @IsString()
  @IsNotEmpty()
  trabajoRealizado?: string;

  @ApiPropertyOptional({ example: 350000 })
  @ValidateIf(isCompleting)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costoFinal?: number;

  @ApiPropertyOptional({ example: '2026-11-02T09:00:00-05:00' })
  @ValidateIf(isCompleting)
  @IsDateString()
  fechaFinalizacion?: string;

  @ApiPropertyOptional({ example: 45250 })
  @ValidateIf(isCompleting)
  @IsInt()
  @Min(0)
  kilometrajeFinal?: number;
}
