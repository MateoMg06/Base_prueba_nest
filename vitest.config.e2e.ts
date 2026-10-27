import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Entorno aislado: BD en memoria y claves propias de test (no usa tu .env real).
    env: {
      NODE_ENV: 'test',
      API_KEYS: 'test-key-1,test-key-2',
      DB_TYPE: 'better-sqlite3',
      DB_DATABASE: ':memory:',
      DB_SYNCHRONIZE: 'true',
      DB_LOGGING: 'false',
    },
  },
});
