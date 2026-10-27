import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/utils/transformers.util.js';

/**
 * Registro de solicitud (RN-01 / RN-05).
 * NO incluye id, estado, creadaEn ni actualizadaEn: los administra el sistema.
 * Si el cliente los envía, el ValidationPipe (whitelist) los descarta.
 */
export class CreateSolicitudDto {
  @ApiProperty({ example: 'Comercializadora XYZ', maxLength: 150 })
  @Trim()
  @IsString({ message: 'cliente debe ser un texto' })
  @IsNotEmpty({ message: 'cliente es obligatorio' })
  @MaxLength(150)
  cliente: string;

  @ApiProperty({ example: 'Solicita cotización de 200 unidades' })
  @Trim()
  @IsString({ message: 'descripcion debe ser un texto' })
  @IsNotEmpty({ message: 'descripcion es obligatoria' })
  descripcion: string;

  @ApiPropertyOptional({
    example: 'asesor1',
    description:
      'Usuario del asesor responsable. Obligatorio para admin/supervisor. ' +
      'Si quien registra es asesor, se ignora y se usa su propio usuario.',
  })
  @IsOptional()
  @Trim()
  @IsString({ message: 'asesor debe ser un texto' })
  @IsNotEmpty({ message: 'asesor no puede estar vacío' })
  @MaxLength(100)
  asesor?: string;
}
