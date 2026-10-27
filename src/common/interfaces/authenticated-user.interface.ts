import { Request } from 'express';
import { Role } from '../enums/role.enum.js';

/** Usuario autenticado por JwtAuthGuard y adjuntado a request.user. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
