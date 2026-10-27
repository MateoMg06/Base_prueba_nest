import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesController } from './maintenances.controller.js';
import { MaintenancesService } from './maintenances.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
})
export class MaintenancesModule {}
