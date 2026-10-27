import { Request } from 'express';
import { Role } from '../enums/role.enum.js';

/** Contenido firmado en el JWT. `sub` es el id del usuario. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

/** Usuario autenticado por JwtAuthGuard y adjuntado a request.user. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
