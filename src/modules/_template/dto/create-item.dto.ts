import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';

export class CreateItemDto {
  @ApiProperty({ example: 'Filtro de aceite', maxLength: 120 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Repuesto para motor diésel',
    maxLength: 255,
  })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
