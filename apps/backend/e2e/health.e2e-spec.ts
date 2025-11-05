import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/healthz -> 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/healthz').expect(200);
    expect(res.body).toEqual(expect.objectContaining({ status: 'ok' }));
    expect(typeof res.body.timestamp).toBe('string');
  });
});
