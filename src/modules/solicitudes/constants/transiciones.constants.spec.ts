import { EstadoSolicitud as E } from '../enums/estado-solicitud.enum.js';
import { esTransicionValida } from './transiciones.constants.js';

describe('Máquina de estados de Solicitud', () => {
  it.each([
    [E.PENDIENTE, E.EN_GESTION, true],
    [E.EN_GESTION, E.RESUELTA, true],
    [E.PENDIENTE, E.RESUELTA, false],
    [E.PENDIENTE, E.PENDIENTE, false],
    [E.EN_GESTION, E.PENDIENTE, false],
    [E.RESUELTA, E.PENDIENTE, false],
    [E.RESUELTA, E.EN_GESTION, false],
  ])('%s → %s = %s', (actual, nuevo, esperado) => {
    expect(esTransicionValida(actual, nuevo)).toBe(esperado);
  });
});
