import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';

/** El estado no se recibe: nace AVAILABLE y cambia por inactivación o mantenimientos. */
export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123', description: 'Se guarda en mayúsculas' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9-]{5,10}$/, {
    message: 'placa debe tener 5 a 10 letras, números o guiones',
  })
  placa: string;

  @ApiProperty({ example: 'Chevrolet' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  marca: string;

  @ApiProperty({ example: 'NHR' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  modelo: string;

  @ApiProperty({ example: 2022, minimum: 1950 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @ApiProperty({ example: 45000, minimum: 0 })
  @IsInt()
  @Min(0)
  kilometraje: number;
}
