import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AppConfig } from '../config/configuration.js';

/**
 * Conexión TypeORM. PostgreSQL es el motor de desarrollo y producción.
 * SQLite se conserva como alternativa en memoria para las pruebas e2e aisladas.
 *
 * autoLoadEntities: toda entidad registrada con TypeOrmModule.forFeature([...]) en
 * cualquier módulo se carga sola; no hay que listar rutas ni globs.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const db = config.getOrThrow<AppConfig['database']>('database');
        const common = {
          autoLoadEntities: true,
          synchronize: db.synchronize,
          logging: db.logging,
        };

        if (db.type === 'better-sqlite3') {
          if (db.database !== ':memory:') {
            mkdirSync(dirname(db.database), { recursive: true });
          }
          return { type: 'better-sqlite3', database: db.database, ...common };
        }

        return {
          type: db.type as 'postgres' | 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          ...common,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
