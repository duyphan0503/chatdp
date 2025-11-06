import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

/**
 * E2E tests for refresh token UA/IP binding behavior.
 * These tests assume REFRESH_BIND_UA_IP=true (default in .env.example).
 */
describe('Auth refresh binding (e2e)', () => {
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

  it('refresh succeeds when User-Agent and IP match', async () => {
    const email = `bind_ok_${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';
    const ua = 'MyApp/1.0 (e2e)';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .set('User-Agent', ua)
      .set('X-Forwarded-For', '1.2.3.4')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', ua)
      .set('X-Forwarded-For', '1.2.3.4')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(200);

    expect(refresh.body.accessToken).toBeDefined();
    expect(refresh.body.refreshToken).toBeDefined();
  });

  it('refresh fails when User-Agent changes (binding enabled)', async () => {
    const email = `bind_ua_${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .set('User-Agent', 'UA-ONE')
      .set('X-Forwarded-For', '5.6.7.8')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', 'UA-TWO')
      .set('X-Forwarded-For', '5.6.7.8')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(401);
  });

  it('refresh fails when IP changes (binding enabled)', async () => {
    const email = `bind_ip_${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .set('User-Agent', 'SameUA/1.0')
      .set('X-Forwarded-For', '9.9.9.9')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', 'SameUA/1.0')
      .set('X-Forwarded-For', '9.9.9.10')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(401);
  });

  it('prefers CF-Connecting-IP over X-Forwarded-For (success when CF IP matches)', async () => {
    const email = `bind_cf_${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .set('User-Agent', 'UA-CF/1.0')
      .set('CF-Connecting-IP', '3.3.3.3')
      .set('X-Forwarded-For', 'should-not-matter, 1.1.1.1')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    // Different XFF but same CF-Connecting-IP should succeed
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', 'UA-CF/1.0')
      .set('CF-Connecting-IP', '3.3.3.3')
      .set('X-Forwarded-For', '2.2.2.2')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(200);
  });

  it('fails when CF-Connecting-IP changes even if X-Forwarded-For matches', async () => {
    const email = `bind_cf_fail_${Math.random().toString(36).slice(2)}@test.io`;
    const password = 'secretpw';

    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .set('User-Agent', 'UA-CF/2.0')
      .set('CF-Connecting-IP', '6.6.6.6')
      .set('X-Forwarded-For', '6.6.6.6')
      .send({ email, password, displayName: 'Tester' })
      .expect(201);

    // CF-Connecting-IP changed -> should fail despite matching XFF
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', 'UA-CF/2.0')
      .set('CF-Connecting-IP', '7.7.7.7')
      .set('X-Forwarded-For', '6.6.6.6')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(401);
  });
});
