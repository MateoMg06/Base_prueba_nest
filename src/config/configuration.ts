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
    type: process.env.DB_TYPE ?? 'better-sqlite3',
    database: process.env.DB_DATABASE ?? 'data/database.sqlite',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: toBool(process.env.DB_SYNCHRONIZE, true),
    logging: toBool(process.env.DB_LOGGING, false),
  },
});

export default configuration;
export type AppConfig = ReturnType<typeof configuration>;
