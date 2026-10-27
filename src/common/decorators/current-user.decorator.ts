import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedUser,
  RequestWithUser,
} from '../interfaces/authenticated-user.interface.js';

/**
 * Inyecta el usuario validado por UserGuard.
 *
 * @example findAll(@CurrentUser() user: AuthenticatedUser)
 * @example findAll(@CurrentUser('role') role: Role)
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
