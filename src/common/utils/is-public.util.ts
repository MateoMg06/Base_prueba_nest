import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../constants/metadata.constants.js';

export const isPublicRoute = (
  reflector: Reflector,
  context: ExecutionContext,
) =>
  reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) === true;

/** Un encabezado puede llegar repetido (string[]); tomamos el primero. */
export const headerValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
