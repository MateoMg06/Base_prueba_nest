# Memoria operativa

## Estado actual

- **Actualizada:** 2026-10-27.
- **Base:** NestJS 12 y TypeORM; PostgreSQL es el motor de desarrollo y
  producción. SQLite en memoria se conserva temporalmente para los e2e de la
  base, hasta adaptar sus pruebas al nuevo dominio.
- **Dominio inicial:** solicitudes comerciales. El repositorio está preparado
  para adaptarse a otro dominio mediante módulos de `src/modules`.
- **Contexto disponible:** existe un enunciado de FleetCore entregado fuera del
  repositorio. Es una especificación funcional de referencia, no una orden de
  modificar automáticamente el proyecto.

## Hito reciente

- 2026-10-27: se clonó la base `MateoMg06/Base_prueba_nest` y se añadió
  `AGENTS.md` con el protocolo de memoria y trabajo del repositorio.
- 2026-10-27: fase 0 iniciada. Se instaló `pg`, se creó `docker-compose.yml`
  para PostgreSQL 16 y se configuraron `.env.example` y `.env` locales para
  FleetCore.

## Convenciones que deben conservarse

- El acceso se protege globalmente mediante API key, usuario y roles; las rutas
  públicas usan `@Public()`.
- Los DTOs se validan globalmente y las respuestas/errores tienen formatos
  estandarizados por interceptor y filtro globales.
- Las pruebas usan Vitest; `npm run check` reúne lint, TypeScript y pruebas.
- `.env`, la carpeta `data/` y artefactos generados son locales y no se versionan.
- `docker compose up -d db` inicia la base PostgreSQL con las credenciales
  ficticias de `.env.example`.

## Pendientes conocidos

- Docker Desktop no estaba ejecutándose, por lo que el contenedor `db` no pudo
  iniciarse. Arráncalo antes de ejecutar `docker compose up -d db`.
- `npm run build` está bloqueado por un defecto preexistente en la base: falta
  el archivo versionado esperado `src/modules/users/data/users.data.ts`.
- Fase siguiente: diseñar las entidades, enums y relaciones del dominio
  FleetCore; no comenzar controladores ni autenticación todavía.
