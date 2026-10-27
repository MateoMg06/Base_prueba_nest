import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity.js';
import { ItemController } from './item.controller.js';
import { ItemService } from './item.service.js';

/**
 * Molde de módulo: copia la carpeta, renombra Item/item y registra el nuevo
 * módulo en AppModule. Esta plantilla NO se registra.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
