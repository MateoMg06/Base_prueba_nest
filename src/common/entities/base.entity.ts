import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Columnas comunes administradas por el sistema (nunca llegan en un DTO).
 * Extiende esta clase en cualquier entidad nueva.
 */
export abstract class BaseEntity {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'creada_en' })
  creadaEn: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'actualizada_en' })
  actualizadaEn: Date;
}
