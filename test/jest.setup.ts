// En modo ESM Jest no crea la variable global `jest`; la dejamos disponible
// para usar jest.fn() en las pruebas igual que en modo normal.
import { jest } from '@jest/globals';

globalThis.jest = jest as unknown as typeof globalThis.jest;
