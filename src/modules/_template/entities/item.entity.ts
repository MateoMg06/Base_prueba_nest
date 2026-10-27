import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';

/** Entidad de ejemplo: también es el modelo que Swagger documenta. */
@Entity('items')
export class Item extends BaseEntity {
  @ApiProperty({ example: 'Filtro de aceite' })
  @Column({ length: 120 })
  nombre: string;

  @ApiPropertyOptional({ example: 'Repuesto para motor diésel' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
