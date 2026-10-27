import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanic } from './entities/mechanic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic])],
})
export class MechanicsModule {}
