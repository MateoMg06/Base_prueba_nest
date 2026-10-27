import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';

// El estado no se envía: el taller nace ACTIVE
export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Central' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 'Calle 10 # 20-30, Medellín' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;
}
