# Memoria operativa

## Estado actual

- **Actualizada:** 2026-10-27.
- **Stack:** NestJS 12, TypeORM y PostgreSQL (único motor; SQLite eliminado).
  Pruebas con Vitest.
- **Dominio:** FleetCore, gestión de mantenimiento de flotas. Cada recurso vive
  en `src/modules/<recurso>`; `src/modules/_template` es el molde CRUD (no
  registrado).
- **Arquitectura:** `src/common/{decorators,dto,filters,guards,interceptors}`
  más soporte (`constants`, `enums`, `interfaces`, `utils`, `entities`).
  `app.module.ts` concentra config + validación de env, TypeORM y providers
  `APP_*`; `main.ts` hace Helmet, CORS y Swagger (Bearer + esquema `api-key`).
- **Enunciado:** `docs/enunciado-prueba-Desempeno-M6_2-Nest Js.pdf`, no
  versionado (`*.pdf` en `.gitignore`). Referencia funcional, no orden de
  implementar todo de una vez.

## Hito reciente

- 2026-10-27: fase 0 (PostgreSQL con `docker-compose.yml`, `.env.example`) y
  fase 1 (entidades `User`, `Vehicle`, `Mechanic`, `Workshop`, `Maintenance` y
  `docs/erd.md`) en `feature/fleetcore-domain-model`.
- 2026-10-27: arquitectura `common/` + `modules/` aplicada; se añadieron
  `helmet`, `PaginationQueryDto` y `_template`.
- 2026-10-27: limpieza de la base según el PDF. Eliminados: auth por `x-user` y
  usuarios en memoria (`users.service.ts`), roles `admin/supervisor/asesor`
  (ahora `Role` = ADMIN/TECHNICIAN/MANAGER en `common/enums`, usado también por
  `User`; se borró `user-role.enum.ts`), `ApiKeyGuard` global, SQLite
  (`better-sqlite3`, `DB_TYPE`, e2e, `db:reset`) y `dist/` obsoleto.
  `npm run check` OK (lint, tsc, 5 pruebas).

- 2026-10-27: fase 2 en `feature/fleetcore-auth`. `AuthModule` (register,
  login, me; bcrypt; `JwtModule` global con `JWT_SECRET`/`JWT_EXPIRES_IN`),
  `UsersService` con repositorio, `JwtAuthGuard` real (token opcional en rutas
  públicas), `@ApiKeyAuth()` + `IntegrationsModule`
  (`GET /integrations/fleet-status`), `statusCodeInWords` en interceptor y
  filtro. Relaciones de entidades tipadas con `Relation<T>` (ESM circular).
  Vitest 10/10, tsc y lint OK; probado contra PostgreSQL: register, 409,
  403 de rol, 400, login, 401 (sin token, inválido, expirado), x-api-key y 404.

- 2026-10-27: fase 3 en `feature/fleetcore-vehicles`. CRUD de vehículos
  (escritura ADMIN, lectura ADMIN/MANAGER), consulta por placa, inactivación
  lógica con bloqueo si hay mantenimientos SCHEDULED/IN_PROGRESS, reactivación,
  kilometraje no decreciente. `Paginated<T>` + `@ApiPaginatedResponse`.
  Fechas pasan a `timestamptz` (antes se desfasaban 5 h). Vitest 15/15 y
  pruebas HTTP contra PostgreSQL OK (incluido 403 por rol).
- 2026-10-27: por decisión explícita del usuario las contraseñas usan bcrypt
  (12 rondas, máx. 72 bytes) en lugar de argon2, aunque el PDF (req. 1.3)
  pide argon2. Probado: register, login, 401 y 400 por >72 bytes.

## Convenciones que deben conservarse

- Guards globales: `JwtAuthGuard` → `RolesGuard`; `@Public()` los salta.
  `ApiKeyGuard` NO es global: usar `@Public() @UseGuards(ApiKeyGuard)` solo en
  endpoints de integración externa.
- Los DTOs se validan globalmente y las respuestas/errores tienen formatos
  estandarizados por `ResponseInterceptor` y `HttpExceptionFilter`.
- `npm run check` reúne lint, TypeScript y pruebas.
- Listados paginados devuelven `Paginated<T>` (`items,total,page,limit`) y se
  documentan con `@ApiPaginatedResponse`. El estado de las entidades nunca
  llega en los DTO de creación/edición; cambia por endpoints dedicados.
- Fechas en columnas `timestamptz`.
- `.env` y artefactos generados son locales y no se versionan.
- `docker compose up -d db` inicia PostgreSQL con las credenciales ficticias de
  `.env.example`.
- Ramas `feature/fleetcore-<funcionalidad>`; ajustes menores van en la rama de
  la funcionalidad relacionada.

## Pendientes conocidos

- Registro: TECHNICIAN abierto; ADMIN/MANAGER solo con Bearer de ADMIN.
- Puertos locales: el `.env` de esta máquina usa `PORT=3001` y `DB_PORT=5434`
  (5432, 5433 y 3000 están ocupados por otros proyectos).
- Requisitos del PDF aún sin implementar: CRUD de mecánicos,
  talleres y mantenimientos con sus reglas (solapes de horario, transiciones de
  estado, kilometraje), seeder idempotente
  (`npm run seed`),
  README con datos del coder, credenciales de prueba y URL de Swagger.
- Docker Desktop debe estar en ejecución antes de `docker compose up -d db`.
