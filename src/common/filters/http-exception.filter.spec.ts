import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  let response: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;
  const filter = new HttpExceptionFilter();

  beforeEach(() => {
    response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'GET', url: '/vehicles/9' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('conserva el código y mensaje de una HttpException', () => {
    filter.catch(new NotFoundException('Vehículo no encontrado'), host);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Vehículo no encontrado',
        path: '/vehicles/9',
        method: 'GET',
      }),
    );
  });

  it('convierte un duplicado de la base de datos en 409', () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      new Error('duplicate key value violates unique constraint'),
    );
    filter.catch(error, host);
    expect(response.status).toHaveBeenCalledWith(409);
  });

  it('un error inesperado responde 500 sin mostrar detalles', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    filter.catch(new Error('fallo interno'), host);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error interno del servidor' }),
    );
  });
});
