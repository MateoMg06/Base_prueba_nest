import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module.js';

/**
 * Módulo raíz: solo compone módulos.
 * - CoreModule: config, guards, pipe, interceptor y filtro globales.
 * - DatabaseModule: conexión TypeORM.
 * - modules/*: un módulo por recurso de negocio (agrega los nuevos aquí;
 *   `nest g module modules/<nombre>` lo hace automáticamente).
 */
@Module({
  imports: [CoreModule, DatabaseModule, HealthModule, SolicitudesModule],
})
export class AppModule {}
