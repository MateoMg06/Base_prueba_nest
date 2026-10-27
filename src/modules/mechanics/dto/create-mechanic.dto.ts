import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';

/** El estado no se recibe: nace ACTIVE y cambia con activate/deactivate. */
export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez', maxLength: 120 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @ApiProperty({ example: 'Motores diésel', maxLength: 120 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  especialidad: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Id de un usuario TECHNICIAN sin mecánico vinculado',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  usuarioId?: number;
}
