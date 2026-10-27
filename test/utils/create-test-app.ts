import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';

export const KEY_1 = 'test-key-1';
export const KEY_2 = 'test-key-2';

/** Levanta la app completa (guards, pipe, interceptor y filtro incluidos). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

/** Cliente HTTP con x-api-key y x-user ya puestos. */
export const as = (
  app: INestApplication,
  user: string,
  apiKey: string = KEY_1,
) => {
  const server = app.getHttpServer();
  const withHeaders = (req: request.Test) =>
    req.set('x-api-key', apiKey).set('x-user', user);

  return {
    get: (url: string) => withHeaders(request(server).get(url)),
    post: (url: string, body?: object) =>
      withHeaders(request(server).post(url)).send(body),
    patch: (url: string, body?: object) =>
      withHeaders(request(server).patch(url)).send(body),
  };
};
