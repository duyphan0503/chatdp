import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

describe('Auth (e2e)', () => {
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

  it('signup -> login -> me with access token', async () => {
    const email = `user${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    expect(signup.body.accessToken).toBeDefined();
    expect(signup.body.refreshToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${signup.body.accessToken}`)
      .expect(200);
    expect(me.body).toEqual(expect.objectContaining({ id: expect.any(String) }));
  });
});
