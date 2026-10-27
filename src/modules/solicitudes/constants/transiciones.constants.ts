import { EstadoSolicitud } from '../enums/estado-solicitud.enum.js';

/**
 * Máquina de estados (RN-03). Única fuente de verdad de las transiciones.
 * Para permitir un cambio nuevo solo se edita este mapa.
 *
 *   PENDIENTE ──► EN_GESTION ──► RESUELTA (final)
 */
export const TRANSICIONES_PERMITIDAS: Record<
  EstadoSolicitud,
  readonly EstadoSolicitud[]
> = {
  [EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.EN_GESTION],
  [EstadoSolicitud.EN_GESTION]: [EstadoSolicitud.RESUELTA],
  [EstadoSolicitud.RESUELTA]: [],
};

export const ESTADO_INICIAL = EstadoSolicitud.PENDIENTE;

export const esTransicionValida = (
  actual: EstadoSolicitud,
  nuevo: EstadoSolicitud,
) => TRANSICIONES_PERMITIDAS[actual].includes(nuevo);
