import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/metadata.constants.js';
import { Role } from '../enums/role.enum.js';

/**
 * Declara los roles autorizados para un endpoint o controlador.
 * Sin @Roles cualquier usuario identificado puede acceder.
 *
 * @example @Roles(Role.ADMIN, Role.SUPERVISOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
