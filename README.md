# FleetCore API

API REST para administrar el mantenimiento preventivo y correctivo de una
flota de vehículos. Está construida con NestJS, TypeScript, TypeORM y
PostgreSQL.

## Inicio con Docker (API + PostgreSQL)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api node dist/seed.js   # datos de prueba
```

- `api` se construye con el `Dockerfile` (multi-stage, `node:22-alpine`) y
  arranca cuando `db` está saludable.
- Ambos servicios comparten la red interna `fleetcore_network`; dentro de
  ella la API se conecta a `db:5432`.
- Los datos de PostgreSQL persisten en el volumen `fleetcore_postgres_data`.
- La API queda en `http://localhost:${PORT}` y Swagger en
  `http://localhost:${PORT}/docs`.
- `docker compose down` detiene todo sin borrar datos (`down -v` sí los borra).

## Inicio local (sin contenedor para la API)

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run start:dev
```

Consulta [la guía de desarrollo](docs/development.md) para comprobar y detener
PostgreSQL.

## Datos de prueba (seeder)

Con la base levantada ejecuta:

```bash
npm run seed
```

Puedes ejecutarlo varias veces: solo crea lo que falta, no duplica registros.

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@fleetcore.com` | `Admin123*` |
| TECHNICIAN | `tecnico1@fleetcore.com` | `Tecnico123*` |
| TECHNICIAN | `tecnico2@fleetcore.com` | `Tecnico123*` |

Crea además 3 mecánicos (2 activos vinculados a los técnicos y 1 inactivo),
2 talleres (1 activo y 1 inactivo), 4 vehículos (`ABC123` y `DEF456`
AVAILABLE, `GHI789` IN_MAINTENANCE y `JKL012` INACTIVE) y 3 mantenimientos:
uno COMPLETED (historial de `ABC123`), uno IN_PROGRESS (`GHI789`) y uno
SCHEDULED (`DEF456`).

## Autenticación y autorización

- `POST /auth/register` (público): crea usuarios `TECHNICIAN`. Para crear un
  `ADMIN` envía el `Bearer` de un ADMIN.
- `POST /auth/login` (público): correo + contraseña → JWT (`JWT_EXPIRES_IN`
  segundos). Las contraseñas se guardan con bcrypt (12 rondas).
- `GET /auth/me`: datos del token actual.
- Todas las demás rutas exigen `Authorization: Bearer <token>`; los roles se
  declaran con `@Roles(...)`.
- `GET /auth/github` (público, abrir en el navegador): login con GitHub
  (OAuth 2.0). GitHub vuelve a `GET /auth/github/callback`, que valida el
  `state`, usa el correo principal verificado de GitHub, crea el usuario como
  `TECHNICIAN` si no existe y entrega el mismo JWT del login normal.
  Requiere una OAuth App de GitHub y `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET` y `GITHUB_CALLBACK_URL` en `.env` (sin ellas la ruta
  responde 503).
- `GET /integrations/fleet-status`: integración externa protegida solo con
  `x-api-key` (una de `API_KEYS`).

## Vehículos

Todas las operaciones son exclusivas del rol `ADMIN`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/vehicles` | Registrar (placa única, nace `AVAILABLE`) |
| GET | `/vehicles?page&limit&estado` | Listar paginado |
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
| GET | `/mechanics?page&limit&estado` | Listar paginado |
| GET | `/mechanics/:id` | Consultar uno |
| PATCH | `/mechanics/:id` | Actualizar |
| PATCH | `/mechanics/:id/deactivate` | Inactivar (conserva historial; 409 si tiene mantenimientos activos) |
| PATCH | `/mechanics/:id/activate` | Activar |

Un mecánico no está atado a un taller, pero no puede tener dos mantenimientos
`SCHEDULED`/`IN_PROGRESS` cuyos horarios se crucen en ningún taller. Cada
mantenimiento ocupa `[fechaProgramada, fechaProgramada + duración)`: uno de
7:30 a 9:00 bloquea otro que empiece a las 8:00, pero no uno a las 9:00.

## Talleres

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/workshops` | ADMIN | Registrar (nace `ACTIVE`) |
| GET | `/workshops?page&limit&estado` | ADMIN | Listar todos (paginado) |
| GET | `/workshops/active` | ADMIN, TECHNICIAN | Listar talleres activos |
| GET | `/workshops/:id` | ADMIN, TECHNICIAN | Consultar uno |
| PATCH | `/workshops/:id` | ADMIN | Actualizar |
| PATCH | `/workshops/:id/deactivate` | ADMIN | Inactivar (409 si tiene mantenimientos activos) |
| PATCH | `/workshops/:id/activate` | ADMIN | Activar |

## Mantenimientos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/maintenances` | ADMIN | Crear (empieza `SCHEDULED`) |
| GET | `/maintenances?page&limit&estado` | ADMIN | Todos (paginado) |
| GET | `/maintenances/active` | ADMIN | Activos (`SCHEDULED` o `IN_PROGRESS`) |
| GET | `/maintenances/vehicle/:vehicleId` | ADMIN | Por vehículo |
| GET | `/maintenances/vehicle/:vehicleId/history` | ADMIN | Historial (`COMPLETED`) del vehículo |
| GET | `/maintenances/mechanic/:mechanicId` | ADMIN | Asignados a un mecánico |
| GET | `/maintenances/mine` | TECHNICIAN | Los asignados al técnico logueado |
| GET | `/maintenances/:id` | ADMIN, TECHNICIAN | Detalle (el técnico solo los suyos) |
| PATCH | `/maintenances/:id/status` | ADMIN, TECHNICIAN | Cambiar estado |

Reglas al crear: vehículo, mecánico y taller deben existir y estar activos;
el vehículo no puede tener otro mantenimiento activo; el kilometraje no puede
ser menor al del vehículo; el horario del mecánico no puede cruzarse con otro.

Cambios de estado permitidos:

```text
SCHEDULED   -> IN_PROGRESS | CANCELLED
IN_PROGRESS -> COMPLETED   | CANCELLED
COMPLETED y CANCELLED son finales
```

- `IN_PROGRESS`: el vehículo pasa a `IN_MAINTENANCE`; el mecánico no puede
  tener otro mantenimiento en curso.
- `COMPLETED`: exige `trabajoRealizado`, `costoFinal`, `fechaFinalizacion` y
  `kilometrajeFinal`; el vehículo vuelve a `AVAILABLE` con el nuevo kilometraje.
- Cancelar uno en curso devuelve el vehículo a `AVAILABLE`.

Crear y cambiar de estado se hacen en transacciones con bloqueo de filas.

## Pruebas (Jest)

```bash
npm test          # pruebas unitarias
npm run test:cov  # con reporte de cobertura (carpeta coverage/)
npm run check     # lint + TypeScript + pruebas
```

- Jest corre en modo ESM (NestJS 12 solo se publica como ESM) con `ts-jest`;
  la configuración está en `jest.config.js`.
- Pruebas clave: transiciones de estado de mantenimientos, cruce de horarios
  de mecánicos, kilometraje no decreciente, inactivaciones con mantenimientos
  activos, registro/login, guards JWT, roles y API Key, interceptor y filtro.
- La cobertura mínima exigida es 40% (`coverageThreshold`); actualmente
  ronda 59% de líneas.

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
