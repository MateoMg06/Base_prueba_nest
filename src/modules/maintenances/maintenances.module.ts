import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './entities/maintenance.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Maintenance])],
})
export class MaintenancesModule {}
