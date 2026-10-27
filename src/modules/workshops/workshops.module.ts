import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workshop } from './entities/workshop.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop])],
})
export class WorkshopsModule {}
