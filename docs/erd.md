# Modelo relacional de FleetCore

```mermaid
erDiagram
  USERS o|--o| MECHANICS : "puede representar"
  VEHICLES ||--o{ MAINTENANCES : recibe
  MECHANICS ||--o{ MAINTENANCES : realiza
  WORKSHOPS ||--o{ MAINTENANCES : alberga

  USERS {
    int id PK
    string nombre
    string email UK
    string password_hash
    enum role
  }
  MECHANICS {
    int id PK
    string nombre
    string correo UK
    string especialidad
    enum estado
    int user_id FK
  }
  VEHICLES {
    int id PK
    string placa UK
    string marca
    string modelo
    int anio
    int kilometraje
    enum estado
  }
  WORKSHOPS {
    int id PK
    string nombre
    string direccion
    enum estado
  }
  MAINTENANCES {
    int id PK
    enum tipo
    string descripcion
    int kilometraje_registrado
    datetime fecha_programada
    int duracion_estimada_minutos
    enum estado
    string trabajo_realizado
    decimal costo_final
    datetime fecha_finalizacion
    int kilometraje_final
    int vehicle_id FK
    int mechanic_id FK
    int workshop_id FK
  }
```

## Decisiones del modelo

- Las placas, correos de usuario y correos de mecánico son únicos.
- La relación entre un usuario y un mecánico es opcional y uno a uno: permite
  registrar administradores sin ficha de mecánico y conservar un
  mecánico sin cuenta de acceso.
- Los mantenimientos conservan las relaciones históricas: las claves foráneas
  restringen borrar vehículos, mecánicos o talleres que ya tengan historial.
- `duracionEstimadaMinutos` permite calcular el intervalo programado de un
  mantenimiento y aplicar después la regla de no solapamiento de un mecánico.
- La información de cierre es nullable al crear el mantenimiento y será
  obligatoria únicamente cuando se cambie a `COMPLETED`.
