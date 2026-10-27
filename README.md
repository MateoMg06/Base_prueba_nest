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

- `POST /auth/register` (público): crea usuarios `TECHNICIAN`. Para crear un
  `ADMIN` envía el `Bearer` de un ADMIN.
- `POST /auth/login` (público): correo + contraseña → JWT (`JWT_EXPIRES_IN`
  segundos). Las contraseñas se guardan con bcrypt (12 rondas).
- `GET /auth/me`: datos del token actual.
- Todas las demás rutas exigen `Authorization: Bearer <token>`; los roles se
  declaran con `@Roles(...)`.
- `GET /integrations/fleet-status`: integración externa protegida solo con
  `x-api-key` (una de `API_KEYS`).

## Vehículos

Todas las operaciones son exclusivas del rol `ADMIN`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/vehicles` | Registrar (placa única, nace `AVAILABLE`) |
| GET | `/vehicles?page&limit&sortBy&order&estado` | Listar paginado |
| GET | `/vehicles/:id` · `/vehicles/plate/:placa` | Consultar por id o placa |
| PATCH | `/vehicles/:id` | Actualizar (el kilometraje no puede bajar) |
| DELETE | `/vehicles/:id` | Inactivar (eliminación lógica; 409 si tiene mantenimientos activos) |
| PATCH | `/vehicles/:id/activate` | Reactivar un vehículo `INACTIVE` |

Los listados responden `data: { items, total, page, limit }`.

## Mecánicos

Todas las operaciones son exclusivas del rol `ADMIN`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/mechanics` | Registrar (correo único, nace `ACTIVE`; `usuarioId` opcional de un TECHNICIAN) |
| GET | `/mechanics?page&limit&sortBy&order&estado` | Listar paginado |
| GET | `/mechanics/:id` | Consultar uno |
| PATCH | `/mechanics/:id` | Actualizar |
| PATCH | `/mechanics/:id/deactivate` | Inactivar (conserva historial; 409 si tiene mantenimientos activos) |
| PATCH | `/mechanics/:id/activate` | Activar |

Un mecánico no está atado a un taller, pero no puede tener dos mantenimientos
`SCHEDULED`/`IN_PROGRESS` cuyos horarios se crucen en ningún taller. Cada
mantenimiento ocupa `[fechaProgramada, fechaProgramada + duración)`: uno de
7:30 a 9:00 bloquea otro que empiece a las 8:00, pero no uno a las 9:00.

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
