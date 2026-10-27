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

## Convenciones que deben conservarse

- Guards globales: `JwtAuthGuard` → `RolesGuard`; `@Public()` los salta.
  `ApiKeyGuard` NO es global: usar `@Public() @UseGuards(ApiKeyGuard)` solo en
  endpoints de integración externa.
- Los DTOs se validan globalmente y las respuestas/errores tienen formatos
  estandarizados por `ResponseInterceptor` y `HttpExceptionFilter`.
- `npm run check` reúne lint, TypeScript y pruebas.
- `.env` y artefactos generados son locales y no se versionan.
- `docker compose up -d db` inicia PostgreSQL con las credenciales ficticias de
  `.env.example`.
- Ramas `feature/fleetcore-<funcionalidad>`; ajustes menores van en la rama de
  la funcionalidad relacionada.

## Pendientes conocidos

- `JwtAuthGuard` es un marcador que rechaza toda ruta privada (falla cerrado)
  hasta implementar la fase de autenticación: registro/login por email,
  Argon2, emisión y verificación de JWT, `request.user`.
- Requisitos del PDF aún sin implementar: CRUD de vehículos, mecánicos,
  talleres y mantenimientos con sus reglas (solapes de horario, transiciones de
  estado, kilometraje), endpoint con x-api-key, seeder idempotente
  (`npm run seed`), código HTTP en palabras en la respuesta (requisito 1.6),
  README con datos del coder, credenciales de prueba y URL de Swagger.
- Docker Desktop debe estar en ejecución antes de `docker compose up -d db`.
