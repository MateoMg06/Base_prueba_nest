import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../common/constants/metadata.constants.js';

/**
 * Marca un endpoint como público: se salta TODOS los guards globales
 * (API key, autenticación y roles). Úsalo solo en endpoints explícitamente públicos.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
