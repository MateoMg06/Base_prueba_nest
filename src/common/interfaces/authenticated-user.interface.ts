import { Request } from 'express';
import { Role } from '../enums/role.enum.js';

/** Usuario validado por UserGuard y adjuntado a request.user. */
export interface AuthenticatedUser {
  username: string;
  name: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
