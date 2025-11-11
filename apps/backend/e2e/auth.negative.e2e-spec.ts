import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

describe('Auth negative (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login with wrong credentials -> 401', async () => {
    // Make sure the email does not exist
    const email = `nope_${Math.random().toString(36).slice(2)}@example.com`;
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrongpw' })
      .expect(401);
  });

  it('refresh with invalid token -> 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'aaa.bbb.ccc' })
      .expect(401);
  });

  it('GET /api/me without Authorization -> 401', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });
});
