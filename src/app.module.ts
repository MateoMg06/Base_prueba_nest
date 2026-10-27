import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { MaintenancesModule } from './modules/maintenances/maintenances.module.js';
import { MechanicsModule } from './modules/mechanics/mechanics.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { WorkshopsModule } from './modules/workshops/workshops.module.js';

// ───────────── Config ─────────────

const toBool = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value === 'true';

/** "k1, k2,,k3" -> ['k1', 'k2', 'k3'] */
const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Configuración tipada de la aplicación.
 * Se consume con ConfigService: config.get('apiKeys'), config.get('database'), etc.
 */
const configuration = () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKeys: parseList(process.env.API_KEYS),
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
  },
  database: {
    database: process.env.DB_DATABASE ?? 'fleetcore',
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME ?? 'fleetcore',
    password: process.env.DB_PASSWORD,
    synchronize: toBool(process.env.DB_SYNCHRONIZE, true),
    logging: toBool(process.env.DB_LOGGING, false),
  },
});

type AppConfig = ReturnType<typeof configuration>;

/**
 * Esquema de las variables de entorno.
 * Si falta una variable obligatoria la aplicación NO arranca (falla rápido).
 * Para agregar una variable nueva: declárala aquí, en configuration y en .env.example.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsString()
  @IsNotEmpty({
    message: 'API_KEYS es obligatoria (claves separadas por comas)',
  })
  API_KEYS: string;

  @IsOptional()
  @IsString()
  DB_DATABASE?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsInt()
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsBooleanString()
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  @IsBooleanString()
  DB_LOGGING?: string;

  @IsOptional()
  @IsString()
  SWAGGER_PATH?: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' })
  JWT_SECRET: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN?: number;

  // Login con GitHub (opcional): si faltan, /auth/github responde 503
  @IsOptional()
  @IsString()
  GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GITHUB_CALLBACK_URL?: string;
}

function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detail = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n - ');
    throw new Error(`Variables de entorno inválidas:\n - ${detail}`);
  }
  return validated;
}

// ───────────── DB ─────────────

/**
 * Conexión TypeORM a PostgreSQL.
 *
 * autoLoadEntities: toda entidad registrada con TypeOrmModule.forFeature([...]) en
 * cualquier módulo se carga sola; no hay que listar rutas ni globs.
 */
const typeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => {
  const db = config.getOrThrow<AppConfig['database']>('database');
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    autoLoadEntities: true,
    synchronize: db.synchronize,
    logging: db.logging,
  };
};

// ───────────── Root module ─────────────

/**
 * Módulo raíz: configuración, conexión a BD, infraestructura global y features.
 * Al registrarse como APP_* aplica a toda la app.
 *
 * Orden de ejecución de los guards = orden de registro:
 *   JwtAuthGuard → RolesGuard → (pipe de validación) → controlador
 *
 * Cada recurso de negocio vive en `src/modules/<recurso>/`; `_template` es solo
 * un molde para copiar y no se registra.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    UsersModule,
    AuthModule,
    IntegrationsModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // Elimina en silencio propiedades que no estén en el DTO (id, estado, fechas...),
        // así nunca pueden modificar campos protegidos. Si la prueba pide RECHAZARLAS
        // con 400, pon forbidNonWhitelisted: true.
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true, // convierte payloads a instancias de DTO y params a su tipo
      }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
