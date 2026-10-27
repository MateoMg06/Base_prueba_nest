import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AppConfig } from '../config/configuration.js';

/**
 * Conexión TypeORM. Por defecto SQLite (better-sqlite3).
 * Para cambiar de motor basta con el .env (DB_TYPE=postgres|mysql + host/puerto/credenciales)
 * e instalar el driver (`npm i pg` o `npm i mysql2`). Ver README › "Cambiar de base de datos".
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
