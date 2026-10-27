import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MaintenancesModule } from './modules/maintenances/maintenances.module.js';
import { MechanicsModule } from './modules/mechanics/mechanics.module.js';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { WorkshopsModule } from './modules/workshops/workshops.module.js';

/**
 * Módulo raíz: solo compone módulos.
 * - CoreModule: config, guards, pipe, interceptor y filtro globales.
 * - DatabaseModule: conexión TypeORM.
 * - modules/*: un módulo por recurso de negocio (agrega los nuevos aquí;
 *   `nest g module modules/<nombre>` lo hace automáticamente).
 */
@Module({
  imports: [
    CoreModule,
    DatabaseModule,
    HealthModule,
    SolicitudesModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
  ],
})
export class AppModule {}
