# Memoria operativa

## Estado actual

- **Actualizada:** 2026-10-27.
- **Base:** NestJS 12 y TypeORM; PostgreSQL es el motor de desarrollo y
  producción. SQLite en memoria se conserva temporalmente para los e2e de la
  base, hasta adaptar sus pruebas al nuevo dominio.
- **Dominio:** FleetCore, gestión de mantenimiento de flotas. Cada recurso vive
  directamente en `src/<recurso>`.
- **Contexto disponible:** existe un enunciado de FleetCore entregado fuera del
  repositorio. Es una especificación funcional de referencia, no una orden de
  modificar automáticamente el proyecto.

## Hito reciente

- 2026-10-27: se clonó la base `MateoMg06/Base_prueba_nest` y se añadió
  `AGENTS.md` con el protocolo de memoria y trabajo del repositorio.
- 2026-10-27: fase 0 iniciada. Se instaló `pg`, se creó `docker-compose.yml`
  para PostgreSQL 16 y se configuraron `.env.example` y `.env` locales para
  FleetCore.
- 2026-10-27: fase 1 completada en `feature/fleetcore-domain-model`. Se
  añadieron las entidades `User`, `Vehicle`, `Mechanic`, `Workshop` y
  `Maintenance`, con sus enums, relaciones e índices, además del ERD en
  `docs/erd.md`.
- 2026-10-27: se reorganizó la arquitectura solicitada: `common` concentra
  tipos y utilidades, `shared` concentra decoradores/guards/filtros/
  interceptores, y los recursos FleetCore viven en la raíz de `src/`. Se
  eliminaron solicitudes, health, pruebas y documentación heredadas.

## Convenciones que deben conservarse

- El acceso se protege globalmente mediante API key, usuario y roles; las rutas
  públicas usan `@Public()`.
- Los DTOs se validan globalmente y las respuestas/errores tienen formatos
  estandarizados por interceptor y filtro globales.
- Las pruebas usan Vitest; `npm run check` reúne lint, TypeScript y pruebas.
- `.env`, la carpeta `data/` y artefactos generados son locales y no se versionan.
- `docker compose up -d db` inicia la base PostgreSQL con las credenciales
  ficticias de `.env.example`.
- Se trabaja por ramas de funcionalidad `feature/fleetcore-<funcionalidad>`;
  los ajustes menores se incluyen en la funcionalidad relacionada.
- `README.md` describe únicamente el proyecto FleetCore y su arquitectura
  vigente.

## Pendientes conocidos

- Docker Desktop no estaba ejecutándose, por lo que el contenedor `db` no pudo
  iniciarse. Arráncalo antes de ejecutar `docker compose up -d db`.
- `npm run build` está bloqueado por un defecto heredado ahora ubicado en
  `src/users/users.service.ts`: falta `data/users.data.ts`. Se sustituirá por
  el repositorio de usuarios durante la funcionalidad de autenticación.
- Fase siguiente: sustituir la autenticación temporal por usuarios persistidos,
  Argon2, JWT, roles y guards. En esa fase se retirará la dependencia de
  `users.data.ts`.
