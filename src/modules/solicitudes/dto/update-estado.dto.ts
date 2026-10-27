import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoSolicitud } from '../enums/estado-solicitud.enum.js';

/** Cambio de estado (RN-03). Solo permite modificar `estado`. */
export class UpdateEstadoDto {
  @ApiProperty({ enum: EstadoSolicitud, example: EstadoSolicitud.EN_GESTION })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  @IsEnum(EstadoSolicitud, {
    message: `estado debe ser uno de: ${Object.values(EstadoSolicitud).join(', ')}`,
  })
  estado: EstadoSolicitud;
}
