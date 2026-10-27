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

## Autenticación y autorización

- `POST /auth/register` (público): crea usuarios `TECHNICIAN`. Para crear
  `ADMIN` o `MANAGER` envía el `Bearer` de un ADMIN.
- `POST /auth/login` (público): correo + contraseña → JWT (`JWT_EXPIRES_IN`
  segundos). Las contraseñas se guardan con argon2id.
- `GET /auth/me`: datos del token actual.
- Todas las demás rutas exigen `Authorization: Bearer <token>`; los roles se
  declaran con `@Roles(...)`.
- `GET /integrations/fleet-status`: integración externa protegida solo con
  `x-api-key` (una de `API_KEYS`).

Toda respuesta incluye `statusCodeInWords` (p. ej. `404` → `"cuatro cero
cuatro"`).

## Estructura

```text
src/
├── common/                  # Utilidades transversales globales
│   ├── decorators/          # @Public(), @Roles(), @CurrentUser(), helpers de Swagger
│   ├── dto/                 # PaginationQueryDto y DTO de error
│   ├── filters/             # HttpExceptionFilter: formato JSON de errores
│   ├── guards/              # JwtAuthGuard → RolesGuard (globales) y ApiKeyGuard (integraciones)
│   ├── interceptors/        # ResponseInterceptor: sobre JSON de éxito
│   └── constants/ enums/ interfaces/ utils/ entities/   # soporte compartido
├── modules/                 # Módulos de dominio autocontenidos
│   ├── _template/           # Molde CRUD (no registrado) para copiar
│   ├── users/  vehicles/  mechanics/  workshops/  maintenances/
├── app.module.ts            # Config + validación de env, TypeORM, globales y features
└── main.ts                  # Bootstrap: Helmet, CORS y Swagger
```

Para crear un recurso nuevo copia `src/modules/_template`, renombra
`Item`/`item` y registra el módulo en `AppModule`.

El modelo de datos y sus decisiones están documentados en
[docs/erd.md](docs/erd.md).
