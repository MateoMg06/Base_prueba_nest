# FleetCore API

API REST para administrar el mantenimiento preventivo y correctivo de una
flota de vehículos. Está construida con NestJS, TypeScript, TypeORM y
PostgreSQL.

> Estado actual: modelo relacional y entorno de desarrollo preparados. Los
> endpoints, autenticación y seeders se implementarán por funcionalidades.

## Inicio local

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run start:dev
```

Consulta [la guía de desarrollo](docs/development.md) para comprobar y detener
PostgreSQL.

## Estructura

```text
src/
├── users/             # Usuarios, roles y autenticación persistida
├── vehicles/          # Vehículos de la flota
├── mechanics/         # Mecánicos y su disponibilidad
├── workshops/         # Talleres
├── maintenances/      # Ciclo de vida de los mantenimientos
├── common/            # Entidades base, enums, DTOs, interfaces y utilidades
├── shared/            # Decoradores, guards, filtros e interceptores
├── config/            # Variables de entorno y Swagger
├── core/              # Registro de infraestructura global
├── database/          # Conexión TypeORM
├── app.module.ts
└── main.ts
```

El modelo de datos y sus decisiones están documentados en
[docs/erd.md](docs/erd.md).
