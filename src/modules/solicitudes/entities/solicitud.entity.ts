import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { EstadoSolicitud } from '../enums/estado-solicitud.enum.js';
import { ESTADO_INICIAL } from '../constants/transiciones.constants.js';

@Entity('solicitudes')
export class Solicitud extends BaseEntity {
  @ApiProperty({ example: 'Comercializadora XYZ' })
  @Column({ length: 150 })
  cliente: string;

  @ApiProperty({ example: 'Solicita cotización de 200 unidades' })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({
    example: 'asesor1',
    description: 'Usuario del asesor responsable',
  })
  @Index() // se filtra por este campo en cada consulta de un asesor
  @Column({ length: 100 })
  asesor: string;

  @ApiProperty({ enum: EstadoSolicitud, example: EstadoSolicitud.PENDIENTE })
  @Column({
    type: 'simple-enum',
    enum: EstadoSolicitud,
    default: ESTADO_INICIAL,
  })
  estado: EstadoSolicitud;
}
