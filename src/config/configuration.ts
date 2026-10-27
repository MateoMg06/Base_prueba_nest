/**
 * Configuración tipada de la aplicación.
 * Se consume con ConfigService: config.get('apiKeys'), config.get('database'), etc.
 */
const toBool = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value === 'true';

/** "k1, k2,,k3" -> ['k1', 'k2', 'k3'] */
export const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const configuration = () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKeys: parseList(process.env.API_KEYS),
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  database: {
    // PostgreSQL es el motor de desarrollo y producción del proyecto.
    // Los tests e2e conservan SQLite en memoria mediante sus variables aisladas.
    type: process.env.DB_TYPE ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'fleetcore',
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME ?? 'fleetcore',
    password: process.env.DB_PASSWORD,
    synchronize: toBool(process.env.DB_SYNCHRONIZE, true),
    logging: toBool(process.env.DB_LOGGING, false),
  },
});

export default configuration;
export type AppConfig = ReturnType<typeof configuration>;
