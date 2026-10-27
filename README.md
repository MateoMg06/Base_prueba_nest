# API Solicitudes Comerciales · Base modular NestJS

API REST con **NestJS 12 + TypeORM + SQLite** para registrar y gestionar solicitudes de seguimiento comercial,
protegida con **x-api-key**, identificación por **x-user** y autorización por **roles**.

Además de resolver la simulación de la prueba, este repo está pensado como **plantilla base**: la parte
transversal (`config`, `core`, `common`, `database`) no depende del negocio, así que para otro enunciado
normalmente solo cambias o agregas módulos dentro de `src/modules/`.
Ver [Adaptar la base a otro enunciado](#-adaptar-la-base-a-otro-enunciado).

---

## Índice

1. [Requisitos](#-requisitos)
2. [Inicio rápido](#-inicio-rápido)
3. [Todos los comandos](#-todos-los-comandos)
4. [Variables de entorno](#-variables-de-entorno)
5. [Arquitectura](#-arquitectura)
6. [Usuarios de prueba y roles](#-usuarios-de-prueba-y-roles)
7. [Endpoints](#-endpoints)
8. [Formato de respuestas](#-formato-de-respuestas)
9. [Reglas de negocio → dónde están](#-reglas-de-negocio--dónde-están)
10. [Pruebas y evidencias](#-pruebas-y-evidencias)
11. [Ejemplos con curl](#-ejemplos-con-curl)
12. [Decisiones técnicas](#-decisiones-técnicas)
13. [Adaptar la base a otro enunciado](#-adaptar-la-base-a-otro-enunciado)
14. [Nest CLI: comandos de referencia](#-nest-cli-comandos-de-referencia)
15. [Git](#-git)
16. [Solución de problemas](#-solución-de-problemas)

---

## 📋 Requisitos

| Herramienta | Versión |
| ----------- | ------- |
| Node.js     | 22.22+ o 24.15+ (probado en 24.14) |
| npm         | 10+ |
| Nest CLI    | opcional global: `npm i -g @nestjs/cli` (si no, usa `npx nest ...`) |

No hace falta instalar ninguna base de datos: SQLite es un archivo (`data/database.sqlite`) que se crea solo.

---

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el .env a partir del ejemplo
cp .env.example .env            # Linux / macOS / Git Bash
copy .env.example .env          # Windows CMD
Copy-Item .env.example .env     # Windows PowerShell

# 3. Levantar en modo desarrollo (recarga automática)
npm run start:dev
```

> Atajo: `npm run setup` crea el `.env` (si no existe) e instala las dependencias.

- API: <http://localhost:3000>
- Swagger: <http://localhost:3000/docs> → botón **Authorize** → `x-api-key: dev-key-123` y `x-user: admin`
- OpenAPI JSON: <http://localhost:3000/docs-json>
- Health (público): <http://localhost:3000/health>

---

## 🧰 Todos los comandos

### npm scripts

| Comando | Qué hace |
| ------- | -------- |
| `npm install` | Instala dependencias |
| `npm run setup` | Copia `.env.example` → `.env` (si no existe) e instala |
| `npm run start` | Arranca la app (sin watch) |
| `npm run start:dev` | Arranca con recarga automática (**el habitual**) |
| `npm run start:debug` | Arranca con debugger + watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta lo compilado (`node dist/main`) — requiere `build` antes |
| `npm run test` | Pruebas unitarias (`*.spec.ts`, Vitest) |
| `npm run test:watch` | Unitarias en modo watch |
| `npm run test:cov` | Unitarias con cobertura (`coverage/`) |
| `npm run test:e2e` | Pruebas end-to-end (`test/*.e2e-spec.ts`, BD en memoria) |
| `npm run test:all` | Unitarias + e2e |
| `npm run lint` | Linter (oxlint) |
| `npm run format` | Formatea con Prettier |
| `npm run check` | lint + typecheck + todas las pruebas (úsalo antes de entregar) |
| `npm run db:reset` | Borra la carpeta `data/` (BD SQLite local) |

### Ejecutar un solo test

```bash
npx vitest run src/modules/solicitudes                       # unitarios de una carpeta
npx vitest run --config ./vitest.config.e2e.ts -t "RN-03"    # e2e cuyo nombre contenga "RN-03"
```

### Producción local

```bash
npm run build
npm run start:prod
```

---

## 🔐 Variables de entorno

Archivo `.env` (plantilla en `.env.example`). Se validan al arrancar en `src/config/env.validation.ts`:
si falta `API_KEYS` la app **no arranca** y dice por qué.

| Variable | Default | Descripción |
| -------- | ------- | ----------- |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3000` | Puerto HTTP |
| `SWAGGER_PATH` | `docs` | Ruta de Swagger |
| `API_KEYS` | — (**obligatoria**) | Claves válidas separadas por comas: `dev-key-123,qa-key-456` |
| `DB_TYPE` | `better-sqlite3` | `better-sqlite3` \| `postgres` \| `mysql` |
| `DB_DATABASE` | `data/database.sqlite` | SQLite: ruta del archivo o `:memory:`. Otros: nombre de la BD |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` | — | Solo postgres/mysql |
| `DB_SYNCHRONIZE` | `true` | Crea/actualiza tablas desde las entidades (solo desarrollo) |
| `DB_LOGGING` | `false` | Muestra el SQL ejecutado (útil para demostrar el `WHERE asesor = ?`) |

Las claves del ejemplo son **ficticias**. En el código no hay ninguna clave escrita.

---

## 🏗 Arquitectura

```
src/
├── main.ts                     # Bootstrap: CORS + Swagger + listen
├── app.module.ts               # Solo compone módulos
│
├── config/                     # ⚙ Configuración (sin lógica de negocio)
│   ├── configuration.ts        #   .env → objeto tipado (apiKeys, database, ...)
│   ├── env.validation.ts       #   valida el .env al arrancar (class-validator)
│   └── swagger.config.ts       #   DocumentBuilder + esquemas x-api-key / x-user
│
├── core/
│   └── core.module.ts          # 🧱 Registro GLOBAL: ConfigModule, 3 guards, ValidationPipe,
│                               #    ResponseInterceptor, AllExceptionsFilter (APP_*)
├── database/
│   └── database.module.ts      # 🗄 TypeORM (SQLite por defecto, cambiable por .env)
│
├── common/                     # ♻ Reutilizable en cualquier proyecto
│   ├── constants/              #   nombres de headers y claves de metadatos
│   ├── decorators/             #   @Roles, @CurrentUser, @Public, @ApiCommonErrors, @ApiWrappedResponse
│   ├── dto/                    #   ErrorResponseDto (para Swagger)
│   ├── entities/               #   BaseEntity (id, creadaEn, actualizadaEn)
│   ├── enums/                  #   Role
│   ├── filters/                #   AllExceptionsFilter
│   ├── guards/                 #   ApiKeyGuard, UserGuard, RolesGuard
│   ├── interceptors/           #   ResponseInterceptor
│   ├── interfaces/             #   AuthenticatedUser, RequestWithUser, ApiResponse
│   └── utils/                  #   @Trim(), isPublicRoute, headerValue
│
└── modules/                    # 📦 Un módulo por recurso de negocio
    ├── health/                 #   GET /health (público)
    ├── users/                  #   usuarios en memoria + UsersService
    │   └── data/users.data.ts
    └── solicitudes/
        ├── constants/          #   máquina de estados (TRANSICIONES_PERMITIDAS)
        ├── dto/                #   CreateSolicitudDto, UpdateEstadoDto
        ├── entities/           #   Solicitud (TypeORM)
        ├── enums/              #   EstadoSolicitud
        ├── solicitudes.controller.ts   # solo HTTP + Swagger
        ├── solicitudes.service.ts      # reglas de negocio + repositorio
        └── solicitudes.module.ts

test/
├── utils/create-test-app.ts    # levanta la app completa + helper as(app, user)
└── solicitudes.e2e-spec.ts     # criterios de aceptación CA1–CA10
docs/
├── postman_collection.json     # colección Postman (Collection Runner)
└── requests.http               # REST Client (VS Code) / JetBrains HTTP
```

### Flujo de una petición

```
Request
  → ApiKeyGuard     401 si x-api-key falta o no está en API_KEYS
  → UserGuard       401 si x-user falta o no existe · adjunta request.user (rol desde memoria)
  → RolesGuard      403 si el rol no está en @Roles(...)
  → ValidationPipe  400 si el DTO no es válido · elimina campos no declarados
  → Controller      delgado: recibe DTO + @CurrentUser()
  → Service         reglas de negocio (propiedad del asesor, transiciones) + TypeORM
  → ResponseInterceptor  { success: true, statusCode, data, timestamp }
  ✖ cualquier excepción → AllExceptionsFilter { success: false, statusCode, error, message, path, method, timestamp }
```

Todo lo global se registra con `APP_GUARD`, `APP_PIPE`, `APP_INTERCEPTOR` y `APP_FILTER` en `CoreModule`,
por eso los tests e2e ejercitan exactamente la misma cadena que producción.

---

## 👥 Usuarios de prueba y roles

Definidos en memoria en `src/modules/users/data/users.data.ts`. El valor de `x-user` es el `username`.
**El rol nunca se recibe del cliente**: se busca en este registro.

| `x-user` | Rol | Puede |
| -------- | --- | ----- |
| `admin` | admin | ver y cambiar estado de todas |
| `supervisor` | supervisor | ver y cambiar estado de todas |
| `asesor1` | asesor | solo las suyas |
| `asesor2` | asesor | solo las suyas |

---

## 🌐 Endpoints

Todos requieren `x-api-key` y `x-user` (excepto `/health`).

| Método | Ruta | Descripción | Códigos |
| ------ | ---- | ----------- | ------- |
| `POST` | `/solicitudes` | Registrar solicitud | 201, 400, 401, 403 |
| `GET` | `/solicitudes` | Listar las permitidas para el usuario | 200, 401, 403 |
| `GET` | `/solicitudes/:id` | Consultar una | 200, 400, 401, 403, 404 |
| `PATCH` | `/solicitudes/:id/estado` | Cambiar estado | 200, 400, 401, 403, 404, 409 |
| `GET` | `/health` | Estado del servicio (público) | 200 |

**Body POST**

```json
{ "cliente": "ACME S.A.S", "descripcion": "Cotización de 200 unidades", "asesor": "asesor1" }
```

`asesor` es obligatorio si registra admin/supervisor (debe ser un usuario con rol asesor);
si registra un asesor se ignora y se usa su propio usuario.

**Body PATCH**

```json
{ "estado": "EN_GESTION" }
```

---

## 📦 Formato de respuestas

**Éxito** (`ResponseInterceptor`)

```json
{
  "success": true,
  "statusCode": 201,
  "data": { "id": 1, "cliente": "ACME S.A.S", "descripcion": "...", "asesor": "asesor1",
            "estado": "PENDIENTE", "creadaEn": "...", "actualizadaEn": "..." },
  "timestamp": "2026-10-26T12:00:00.000Z"
}
```

**Error** (`AllExceptionsFilter`) — conserva el código HTTP real

```json
{
  "success": false,
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "No se puede cambiar de PENDIENTE a RESUELTA. Transición permitida: PENDIENTE → EN_GESTION",
  "path": "/solicitudes/1/estado",
  "method": "PATCH",
  "timestamp": "2026-10-26T12:00:00.000Z"
}
```

| Causa | Código |
| ----- | ------ |
| DTO inválido, id no numérico, asesor inválido | 400 |
| Falta/inválida `x-api-key`, falta/inexistente `x-user` | 401 |
| Rol no autorizado por `@Roles` | 403 |
| Solicitud inexistente o ajena (asesor) | 404 |
| Transición de estado inválida | 409 |
| Error inesperado (se registra en log) | 500 |

---

## ✅ Reglas de negocio → dónde están

| Regla | Implementación |
| ----- | -------------- |
| RN-01 Estado inicial PENDIENTE | `SolicitudesService.create` fuerza `ESTADO_INICIAL`; el DTO no tiene `estado` |
| RN-01 Asesor = quien registra | `SolicitudesService.resolveAsesor` |
| RN-02 Asesor solo ve lo suyo (en la BD) | `SolicitudesService.scopeFor` → `WHERE asesor = :username` en `find`/`findOne` |
| RN-02 También en consulta individual | `findOne` usa `{ id, ...scopeFor(user) }` |
| RN-03 Transiciones | `solicitudes/constants/transiciones.constants.ts` → 409 si no es válida |
| RN-03 Asesor solo cambia lo suyo | `updateEstado` reutiliza `findOne` con el mismo filtro |
| RN-04 x-api-key múltiple desde .env | `ApiKeyGuard` + `API_KEYS` (comparación en tiempo constante) |
| RN-05 Validación | DTOs con class-validator + `ValidationPipe` global (`whitelist`, `transform`) |
| RN-06 Respuestas y errores | `ResponseInterceptor` + `AllExceptionsFilter` |
| Decoradores personalizados | `@Roles()`, `@CurrentUser()`, `@Public()`, `@ApiWrappedResponse()`, `@ApiCommonErrors()` |

Para ver el SQL con el filtro del asesor: `DB_LOGGING=true` en `.env` y consulta como `asesor1`.

---

## 🧪 Pruebas y evidencias

```bash
npm run test       # unitarias: máquina de estados, ApiKeyGuard
npm run test:e2e   # end-to-end: 22 escenarios contra la app completa (SQLite en memoria)
npm run test:all   # ambas
```

Los e2e usan su propio entorno (definido en `vitest.config.e2e.ts`: `API_KEYS=test-key-1,test-key-2`,
`DB_DATABASE=:memory:`), así que no tocan tu `.env` ni tu BD local.

| Criterio de aceptación | Test (`test/solicitudes.e2e-spec.ts`) |
| ---------------------- | ------------------------------------- |
| CA1 sin x-api-key rechazada | `CA1 · rechaza petición sin x-api-key` |
| CA2 clave inválida rechazada | `CA2 · rechaza clave inválida ... sin ejecutar el endpoint` |
| CA3 dos claves funcionan | `CA3 · dos claves distintas del entorno funcionan` |
| CA4 DTO rechaza datos inválidos | `CA4 · ...` (2 tests) |
| CA5 persistencia TypeORM | `CA5 · persiste en TypeORM ...` (verifica en el repositorio) |
| CA6 asesor solo ve las suyas | `CA6 · asesor solo ve sus solicitudes` |
| CA7 asesor no cambia ajenas | `CA7 · asesor no cambia estado de solicitud ajena` |
| CA8 transiciones inválidas | `CA8 · PENDIENTE → RESUELTA ...`, `CA8 · no se reabre ...` |
| CA9 respuesta uniforme | `CA9 · respuesta exitosa uniforme` |
| CA10 error normalizado | `CA10 · error normalizado conservando el código HTTP real` |
| CA11 Swagger | <http://localhost:3000/docs> |
| CA12 README | este archivo |

**Evidencia manual**

- **Postman**: importa `docs/postman_collection.json` → *Run collection* (en orden). Cada request valida su código HTTP.
- **REST Client** (VS Code) / JetBrains: abre `docs/requests.http` y pulsa *Send Request*.
- **Swagger**: `/docs` → *Authorize* → *Try it out*.

---

## 💻 Ejemplos con curl

**Bash / Git Bash**

```bash
BASE=http://localhost:3000
K=dev-key-123

curl -i $BASE/solicitudes                                              # 401 sin clave
curl -i -H "x-api-key: mala" -H "x-user: admin" $BASE/solicitudes      # 401 clave inválida

curl -s -X POST $BASE/solicitudes -H "x-api-key: $K" -H "x-user: asesor1" \
  -H "Content-Type: application/json" \
  -d '{"cliente":"ACME","descripcion":"Cotizar","estado":"RESUELTA"}'  # 201, estado PENDIENTE

curl -s -H "x-api-key: qa-key-456" -H "x-user: asesor1" $BASE/solicitudes   # segunda clave, solo las suyas
curl -s -H "x-api-key: $K" -H "x-user: asesor2" $BASE/solicitudes/1         # 404 (ajena)

curl -s -X PATCH $BASE/solicitudes/1/estado -H "x-api-key: $K" -H "x-user: admin" \
  -H "Content-Type: application/json" -d '{"estado":"RESUELTA"}'           # 409
curl -s -X PATCH $BASE/solicitudes/1/estado -H "x-api-key: $K" -H "x-user: asesor1" \
  -H "Content-Type: application/json" -d '{"estado":"EN_GESTION"}'         # 200
```

**PowerShell**

```powershell
$h = @{ "x-api-key" = "dev-key-123"; "x-user" = "asesor1" }
Invoke-RestMethod http://localhost:3000/solicitudes -Method Post -Headers $h `
  -ContentType "application/json" -Body '{"cliente":"ACME","descripcion":"Cotizar"}'
Invoke-RestMethod http://localhost:3000/solicitudes -Headers $h
```

> En PowerShell usa `curl.exe` (no `curl`, que es un alias de `Invoke-WebRequest`).

---

## 🧠 Decisiones técnicas

| Decisión | Por qué | Cómo cambiarla |
| -------- | ------- | -------------- |
| **3 guards separados** (api-key → usuario → roles) | Una responsabilidad cada uno; el orden garantiza que sin clave no se ejecuta nada | Orden en `core.module.ts` |
| **Guards globales con `@Public()`** | Imposible olvidar proteger un endpoint nuevo | Quitar el `APP_GUARD` y usar `@UseGuards()` por controlador |
| **Campos extra se eliminan en silencio** (`whitelist: true`) | RN-01 pide *ignorar* el estado enviado; nunca se modifican campos protegidos | `forbidNonWhitelisted: true` en `core.module.ts` → responde 400 |
| **Solicitud ajena = 404** | No revela que el id existe (recomendación OWASP) | En `findOne`, buscar por id y lanzar `ForbiddenException` si `asesor !== user.username` |
| **Transición inválida = 409 Conflict** | Es un conflicto con el estado actual del recurso, no un dato mal formado | Cambiar `ConflictException` por `BadRequestException`/`UnprocessableEntityException` en el servicio |
| **Máquina de estados en un mapa** | Una sola fuente de verdad, testeable aislada | Editar `TRANSICIONES_PERMITIDAS` |
| **`asesor` validado contra usuarios** | Evita asignar a alguien inexistente o que no es asesor | `resolveAsesor` en el servicio |
| **better-sqlite3** | Driver SQLite síncrono y estable, sin servidor | `DB_TYPE` en `.env` |
| **`synchronize: true`** | Cero migraciones para la prueba | `DB_SYNCHRONIZE=false` + migraciones (ver abajo) |
| **Comparación de API key en tiempo constante** | Evita ataques de timing | — |

---

## 🔁 Adaptar la base a otro enunciado

### 1. Nuevo recurso CRUD (ej. `productos`)

```bash
# Genera module + controller + service + dto + entity y lo registra en AppModule
npx nest g resource modules/productos --no-spec     # elegir: REST API → Yes (CRUD)
```

Luego:

1. **Entidad** `entities/producto.entity.ts`: `@Entity('productos') export class Producto extends BaseEntity { ... }`
   (hereda `id`, `creadaEn`, `actualizadaEn`).
2. **Módulo**: `imports: [TypeOrmModule.forFeature([Producto])]` (se carga solo por `autoLoadEntities`).
3. **DTOs** con `class-validator` + `@ApiProperty()`. Para el update: `PartialType(CreateProductoDto)` de `@nestjs/swagger`.
4. **Servicio**: `@InjectRepository(Producto) private repo: Repository<Producto>`.
5. **Controlador**: `@ApiTags('Productos')`, `@ApiCommonErrors()`, `@Roles(...)`, `@CurrentUser()`,
   `@ApiWrappedResponse(Producto)`. Usa `ParseIntPipe` (o `ParseUUIDPipe`) en `:id`.
6. **Imports ESM**: este proyecto es ESM → los imports relativos terminan en `.js` (`'./productos.service.js'`).
7. Test e2e copiando el patrón de `test/solicitudes.e2e-spec.ts`.

Recurso con relación (ej. `Producto` ↔ `Categoria`):

```ts
@ManyToOne(() => Categoria, (c) => c.productos, { nullable: false, onDelete: 'RESTRICT' })
categoria: Categoria;

@OneToMany(() => Producto, (p) => p.categoria)
productos: Producto[];
```

### 2. Cambiar roles o usuarios

- Roles: `src/common/enums/role.enum.ts`.
- Usuarios: `src/modules/users/data/users.data.ts`.
- Usar en endpoints: `@Roles(Role.ADMIN)` (método o clase; el de método tiene prioridad).

### 3. Usuarios en base de datos en vez de memoria

Crear `modules/users/entities/user.entity.ts`, `TypeOrmModule.forFeature([User])` en `UsersModule`
y reimplementar `UsersService.findByUsername` con el repositorio (hacerlo `async` y `await` en `UserGuard`).
Los guards y decoradores no cambian.

### 4. Cambiar encabezados o mecanismo de auth

- Nombres de headers: `src/common/constants/headers.constants.ts`.
- **JWT** (si lo piden): `npm i @nestjs/jwt @nestjs/passport passport passport-jwt` y reemplazar `UserGuard`
  por un guard que verifique el token y llene `request.user`. `RolesGuard`, `@Roles` y `@CurrentUser` siguen igual.

### 5. Cambiar la máquina de estados

Editar `src/modules/solicitudes/enums/estado-solicitud.enum.ts` y `constants/transiciones.constants.ts`:

```ts
[EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.EN_GESTION, EstadoSolicitud.CANCELADA],
```

### 6. Restringir una acción por rol

```ts
@Delete(':id')
@Roles(Role.ADMIN)            // supervisor/asesor → 403
remove(@Param('id', ParseIntPipe) id: number) { ... }
```

Para reglas que dependen del **registro** (propiedad), hazlo en el servicio como `scopeFor()`.

### 7. Filtros y paginación en listados

```ts
export class QuerySolicitudDto {
  @IsOptional() @IsEnum(EstadoSolicitud) estado?: EstadoSolicitud;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 10;
}
// controller: findAll(@Query() q: QuerySolicitudDto, @CurrentUser() u)
// service:   repo.findAndCount({ where: { ...scopeFor(u), ...(q.estado && { estado: q.estado }) },
//                                skip: (q.page - 1) * q.limit, take: q.limit })
```

### 8. Cambiar de base de datos

**PostgreSQL**

```bash
npm i pg
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=prueba -p 5432:5432 postgres:16
```

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=prueba
```

**MySQL**: `npm i mysql2` y `DB_TYPE=mysql`, `DB_PORT=3306`.

### 9. Migraciones en vez de `synchronize`

```bash
# requiere un data-source.ts exportando new DataSource({...}) con las entidades
npx typeorm-ts-node-esm migration:generate src/database/migrations/Init -d src/database/data-source.ts
npx typeorm-ts-node-esm migration:run -d src/database/data-source.ts
```

y `DB_SYNCHRONIZE=false`.

### 10. Nueva variable de entorno

1. `.env.example` y `.env`.
2. Validación en `src/config/env.validation.ts`.
3. Mapearla en `src/config/configuration.ts`.
4. Leerla con `config.get('miVariable')` (inyectando `ConfigService`).

### 11. Cambiar el formato de respuesta

- Éxito: `src/common/interceptors/response.interceptor.ts` (+ `api-wrapped-response.decorator.ts` para Swagger).
- Error: `src/common/filters/all-exceptions.filter.ts` (+ `common/dto/error-response.dto.ts`).
- Mapear más errores de BD: agregar casos en `AllExceptionsFilter.resolve()`.

### 12. Prefijo y versionado de la API

En `main.ts`, antes de `setupSwagger`:

```ts
app.setGlobalPrefix('api');                       // /api/solicitudes
app.enableVersioning({ type: VersioningType.URI }); // @Controller({ path: 'solicitudes', version: '1' }) → /v1/...
```

(Ajustar `path` en los tests e2e si se aplica el prefijo; `createTestApp` no pasa por `main.ts`.)

### 13. Endpoint público adicional

```ts
@Public()
@Get('catalogo')
catalogo() { ... }
```

---

## 🛠 Nest CLI: comandos de referencia

```bash
npx nest --help
npx nest info                                    # versiones instaladas

# Generadores (agregar --no-spec para no crear tests, --dry-run para previsualizar)
npx nest g resource modules/<nombre>             # CRUD completo
npx nest g module modules/<nombre>               # módulo (se registra en AppModule)
npx nest g controller modules/<nombre>
npx nest g service modules/<nombre>
npx nest g class modules/<nombre>/dto/create-<nombre>.dto --flat
npx nest g class modules/<nombre>/entities/<nombre>.entity --flat
npx nest g guard common/guards/<nombre> --flat
npx nest g interceptor common/interceptors/<nombre> --flat
npx nest g filter common/filters/<nombre> --flat
npx nest g decorator common/decorators/<nombre> --flat
npx nest g pipe common/pipes/<nombre> --flat
npx nest g middleware common/middleware/<nombre> --flat
npx nest g interface common/interfaces/<nombre> --flat
```

| Alias | Schematic |
| ----- | --------- |
| `res` | resource |
| `mo` | module |
| `co` | controller |
| `s` | service |
| `gu` | guard |
| `itc` | interceptor |
| `f` | filter |
| `d` | decorator |
| `pi` | pipe |
| `mi` | middleware |
| `cl` | class |

Este repo fue creado con `nest new` y sus componentes con `nest g` (module, controller, service, guard,
interceptor, filter, decorator).

---

## 🌱 Git

```bash
git init
git add .
git commit -m "feat: base API solicitudes comerciales"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

`.env`, `node_modules/`, `dist/` y `data/` están en `.gitignore`; solo se versiona `.env.example`.

---

## 🩺 Solución de problemas

| Problema | Solución |
| -------- | -------- |
| `Variables de entorno inválidas: API_KEYS es obligatoria` | Falta el `.env`: `cp .env.example .env` |
| `EADDRINUSE :3000` | Otro proceso usa el puerto: cambia `PORT` en `.env`, o libéralo (`npx kill-port 3000`) |
| Error compilando `better-sqlite3` | Usa Node LTS (22/24) y reinstala: `rm -rf node_modules && npm install`. En Windows puede requerir *Build Tools* de Visual Studio |
| Cambié una entidad y la tabla no cuadra | `npm run db:reset` y reinicia (con `synchronize`) |
| `Cannot find module './x'` | Proyecto ESM: los imports relativos deben terminar en `.js` |
| Swagger devuelve 401 | Pulsa **Authorize** e ingresa `x-api-key` **y** `x-user` |
| PowerShell: `curl` no acepta `-H` | Usa `curl.exe` o `Invoke-RestMethod` |

---

> Mecanismo de identificación con `x-user` **exclusivamente académico**; no apto para producción.
