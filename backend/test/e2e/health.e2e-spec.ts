import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import request from 'supertest';

// Démarrage complet sur la vraie base, fermeture du pool comprise.
describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /health reports the database up', () =>
    request(app.getHttpServer()).get('/health').expect(200, { database: true }));
});
