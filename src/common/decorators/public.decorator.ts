import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/metadata.constants.js';

/**
 * Marca un endpoint como público: se salta los guards globales (JWT y roles).
 * Úsalo en login/registro o, junto con ApiKeyGuard, en integraciones externas.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
