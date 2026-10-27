import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import configuration from '../config/configuration.js';
import { validateEnv } from '../config/env.validation.js';
import { ApiKeyGuard } from '../shared/guards/api-key.guard.js';
import { UserGuard } from '../shared/guards/user.guard.js';
import { RolesGuard } from '../shared/guards/roles.guard.js';
import { ResponseInterceptor } from '../shared/interceptors/response.interceptor.js';
import { AllExceptionsFilter } from '../shared/filters/all-exceptions.filter.js';
import { UsersModule } from '../users/users.module.js';

/**
 * Infraestructura transversal registrada UNA sola vez.
 * Al registrarse como APP_* aplica a toda la app (y también en los tests e2e,
 * sin tener que repetir nada en main.ts).
 *
 * Orden de ejecución de los guards = orden de registro:
 *   ApiKeyGuard → UserGuard → RolesGuard → (pipe de validación) → controlador
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: UserGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // Elimina en silencio propiedades que no estén en el DTO (id, estado, fechas...),
        // así nunca pueden modificar campos protegidos. RN-01 pide IGNORAR el estado
        // enviado; si la prueba pide RECHAZARLO con 400, pon forbidNonWhitelisted: true.
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true, // convierte payloads a instancias de DTO y params a su tipo
      }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class CoreModule {}
