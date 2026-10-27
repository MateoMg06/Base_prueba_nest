import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/metadata.constants.js';

/**
 * Marca un endpoint como público: se salta TODOS los guards globales
 * (x-api-key, x-user y roles). Úsalo solo en endpoints no funcionales (ej. health).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
