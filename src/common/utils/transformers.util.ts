import { Transform } from 'class-transformer';

/** Recorta espacios para que "   " cuente como cadena vacía en @IsNotEmpty. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
