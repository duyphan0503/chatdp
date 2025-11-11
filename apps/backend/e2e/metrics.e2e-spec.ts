import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

describe('Metrics (e2e)', () => {
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

  it('GET /api/metrics returns prometheus metrics text', async () => {
    const res = await request(app.getHttpServer()).get('/api/metrics').expect(200);
    // Basic assertions: default process metrics + our custom ones
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('prisma_query_duration_seconds');
  });
});
