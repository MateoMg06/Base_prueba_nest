// Jest en modo ESM porque NestJS 12 solo se publica como ESM.
export default {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  // Los imports terminan en .js (ESM); Jest debe buscar el archivo .ts
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/../test/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  // Cobertura: solo código con lógica (sin módulos, DTOs, entidades ni bootstrap)
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.enum.ts',
    '!**/*.interface.ts',
    '!main.ts',
    '!seed.ts',
    '!modules/_template/**',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: { lines: 40, statements: 40, functions: 40, branches: 40 },
  },
};
