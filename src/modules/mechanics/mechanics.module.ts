import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsController } from './mechanics.controller.js';
import { MechanicsService } from './mechanics.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic, Maintenance, User])],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  exports: [MechanicsService],
})
export class MechanicsModule {}
