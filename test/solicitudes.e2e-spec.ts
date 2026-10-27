import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { as, createTestApp, KEY_1, KEY_2 } from './utils/create-test-app.js';
import { Solicitud } from '../src/modules/solicitudes/entities/solicitud.entity.js';

/**
 * Evidencia automatizada de los criterios de aceptación (sección 7 del enunciado).
 * Ejecutar: npm run test:e2e
 */
describe('Solicitudes (e2e)', () => {
  let app: INestApplication;
  const nueva = {
    cliente: 'ACME S.A.S',
    descripcion: 'Cotización de 200 unidades',
  };

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('RN-04 · x-api-key', () => {
    it('CA1 · rechaza petición sin x-api-key (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-user', 'admin')
        .expect(401);
      expect(res.body.message).toMatch(/x-api-key/);
    });

    it('CA2 · rechaza clave inválida (401) sin ejecutar el endpoint', async () => {
      await as(app, 'admin', 'clave-falsa')
        .post('/solicitudes', nueva)
        .expect(401);
      const count = await app.get(DataSource).getRepository(Solicitud).count();
      expect(count).toBe(0);
    });

    it('CA3 · dos claves distintas del entorno funcionan', async () => {
      await as(app, 'admin', KEY_1).get('/solicitudes').expect(200);
      await as(app, 'admin', KEY_2).get('/solicitudes').expect(200);
    });

    it('/health es público', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('Identidad x-user', () => {
    it('rechaza sin x-user (401)', async () => {
      await request(app.getHttpServer())
        .get('/solicitudes')
        .set('x-api-key', KEY_1)
        .expect(401);
    });

    it('rechaza usuario inexistente (401)', async () => {
      await as(app, 'hacker').get('/solicitudes').expect(401);
    });
  });

  describe('RN-05 · validación de DTO', () => {
    it('CA4 · rechaza campos obligatorios faltantes', async () => {
      const res = await as(app, 'asesor1').post('/solicitudes', {}).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'cliente es obligatorio',
          'descripcion es obligatoria',
        ]),
      );
    });

    it('CA4 · rechaza cadenas vacías y tipos incorrectos', async () => {
      await as(app, 'asesor1')
        .post('/solicitudes', { cliente: '   ', descripcion: 123 })
        .expect(400);
    });

    it('rechaza estado fuera del enum', async () => {
      const { body } = await as(app, 'asesor1')
        .post('/solicitudes', nueva)
        .expect(201);
      await as(app, 'asesor1')
        .patch(`/solicitudes/${body.data.id}/estado`, { estado: 'CERRADA' })
        .expect(400);
    });

    it('rechaza id no numérico', async () => {
      await as(app, 'admin').get('/solicitudes/abc').expect(400);
    });
  });

  describe('RN-01 · registro', () => {
    it('CA5 · persiste en TypeORM con estado PENDIENTE e ignora campos protegidos', async () => {
      const { body } = await as(app, 'asesor1')
        .post('/solicitudes', {
          ...nueva,
          estado: 'RESUELTA',
          id: 999,
          asesor: 'asesor2',
        })
        .expect(201);

      expect(body.data).toMatchObject({
        cliente: nueva.cliente,
        estado: 'PENDIENTE',
        asesor: 'asesor1', // el asesor que registra, no el enviado
      });
      expect(body.data.id).not.toBe(999);

      const enBd = await app
        .get(DataSource)
        .getRepository(Solicitud)
        .findOneByOrFail({ id: body.data.id });
      expect(enBd.estado).toBe('PENDIENTE');
    });

    it('supervisor debe indicar un asesor válido', async () => {
      await as(app, 'supervisor').post('/solicitudes', nueva).expect(400);
      await as(app, 'supervisor')
        .post('/solicitudes', { ...nueva, asesor: 'admin' })
        .expect(400);
      const { body } = await as(app, 'supervisor')
        .post('/solicitudes', { ...nueva, asesor: 'asesor2' })
        .expect(201);
      expect(body.data.asesor).toBe('asesor2');
    });
  });

  describe('RN-02 · consulta', () => {
    beforeEach(async () => {
      await as(app, 'asesor1').post('/solicitudes', nueva).expect(201);
      await as(app, 'asesor2').post('/solicitudes', nueva).expect(201);
    });

    it('CA6 · asesor solo ve sus solicitudes', async () => {
      const { body } = await as(app, 'asesor1').get('/solicitudes').expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data.every((s: Solicitud) => s.asesor === 'asesor1')).toBe(
        true,
      );
    });

    it('admin y supervisor ven todas', async () => {
      for (const user of ['admin', 'supervisor']) {
        const { body } = await as(app, user).get('/solicitudes').expect(200);
        expect(body.data).toHaveLength(2);
      }
    });

    it('asesor no puede ver una solicitud ajena por id (404)', async () => {
      const { body } = await as(app, 'asesor2').get('/solicitudes').expect(200);
      const ajenaId = body.data[0].id;
      await as(app, 'asesor1').get(`/solicitudes/${ajenaId}`).expect(404);
      await as(app, 'asesor2').get(`/solicitudes/${ajenaId}`).expect(200);
    });

    it('id inexistente → 404', async () => {
      await as(app, 'admin').get('/solicitudes/9999').expect(404);
    });
  });

  describe('RN-03 · cambio de estado', () => {
    let id: number;

    beforeEach(async () => {
      const { body } = await as(app, 'asesor1')
        .post('/solicitudes', nueva)
        .expect(201);
      id = body.data.id;
    });

    it('flujo válido PENDIENTE → EN_GESTION → RESUELTA', async () => {
      const r1 = await as(app, 'asesor1')
        .patch(`/solicitudes/${id}/estado`, { estado: 'EN_GESTION' })
        .expect(200);
      expect(r1.body.data.estado).toBe('EN_GESTION');

      const r2 = await as(app, 'supervisor')
        .patch(`/solicitudes/${id}/estado`, { estado: 'RESUELTA' })
        .expect(200);
      expect(r2.body.data.estado).toBe('RESUELTA');
    });

    it('CA7 · asesor no cambia estado de solicitud ajena', async () => {
      await as(app, 'asesor2')
        .patch(`/solicitudes/${id}/estado`, { estado: 'EN_GESTION' })
        .expect(404);
    });

    it('CA8 · PENDIENTE → RESUELTA se rechaza (409)', async () => {
      const res = await as(app, 'admin')
        .patch(`/solicitudes/${id}/estado`, { estado: 'RESUELTA' })
        .expect(409);
      expect(res.body.message).toMatch(/PENDIENTE a RESUELTA/);
    });

    it('CA8 · no se reabre una RESUELTA (409)', async () => {
      await as(app, 'admin').patch(`/solicitudes/${id}/estado`, {
        estado: 'EN_GESTION',
      });
      await as(app, 'admin').patch(`/solicitudes/${id}/estado`, {
        estado: 'RESUELTA',
      });
      for (const estado of ['PENDIENTE', 'EN_GESTION']) {
        await as(app, 'admin')
          .patch(`/solicitudes/${id}/estado`, { estado })
          .expect(409);
      }
    });
  });

  describe('RN-06 · formato de respuestas', () => {
    it('CA9 · respuesta exitosa uniforme', async () => {
      const { body } = await as(app, 'admin').get('/solicitudes').expect(200);
      expect(body).toEqual({
        success: true,
        statusCode: 200,
        data: [],
        timestamp: expect.any(String),
      });
    });

    it('CA10 · error normalizado conservando el código HTTP real', async () => {
      const { body } = await as(app, 'admin')
        .get('/solicitudes/9999')
        .expect(404);
      expect(body).toEqual({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: expect.any(String),
        path: '/solicitudes/9999',
        method: 'GET',
        timestamp: expect.any(String),
      });
    });
  });
});
