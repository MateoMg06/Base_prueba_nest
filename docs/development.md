# Entorno de desarrollo

## PostgreSQL local

1. Copia `.env.example` a `.env` si aún no existe.
2. Inicia Docker Desktop.
3. Ejecuta `docker compose up -d db`.
4. Comprueba el estado con `docker compose ps`.
5. Inicia la API con `npm run start:dev`.

El servicio `db` usa PostgreSQL 16 y crea un volumen local llamado
`fleetcore_postgres_data`. Las credenciales incluidas en `.env.example` son
solo para desarrollo local; cámbialas en cualquier entorno compartido.

Para detener la base sin eliminar los datos, ejecuta `docker compose stop db`.
Para eliminar también los datos locales, ejecuta `docker compose down -v`.
