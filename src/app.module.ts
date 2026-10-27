import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module.js';
import { DatabaseModule } from './database/database.module.js';
import { MaintenancesModule } from './maintenances/maintenances.module.js';
import { MechanicsModule } from './mechanics/mechanics.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { WorkshopsModule } from './workshops/workshops.module.js';

/**
 * Módulo raíz: solo compone módulos.
 * - CoreModule: config, guards, pipe, interceptor y filtro globales.
 * - DatabaseModule: conexión TypeORM.
 * - Cada recurso de negocio vive directamente en `src/<recurso>/`.
 */
@Module({
  imports: [
    CoreModule,
    DatabaseModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
  ],
})
export class AppModule {}
