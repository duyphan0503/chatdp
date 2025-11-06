import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

function randEmail() {
  return `neg_${Math.random().toString(36).slice(2)}@test.io`;
}

async function signup(app: INestApplication, email: string) {
  const password = 'secretpw';
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email, password, displayName: 'Tester' })
    .expect(201);
  return { accessToken: res.body.accessToken as string, refreshToken: res.body.refreshToken as string, userId: res.body.user.id as string };
}

describe('Conversations & Messages negative (e2e)', () => {
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

  it('PATCH group metadata by non-admin -> 403, and by non-participant -> 403', async () => {
    const u1 = await signup(app, randEmail()); // creator -> admin
    const u2 = await signup(app, randEmail()); // member
    const u3 = await signup(app, randEmail()); // non-participant

    const convCreate = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'group', participantUserIds: [u2.userId], groupName: 'G1' })
      .expect(201);
    const conversationId = convCreate.body.id as string;

    // Non-admin member tries to update -> 403
    await request(app.getHttpServer())
      .patch(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .send({ groupName: 'Hacked' })
      .expect(403);

    // Non-participant tries to update -> 403
    await request(app.getHttpServer())
      .patch(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${u3.accessToken}`)
      .send({ groupName: 'Hacked 2' })
      .expect(403);
  });

  it('messages endpoints: non-participant cannot list/create/markRead/getStatuses -> 403', async () => {
    const u1 = await signup(app, randEmail()); // participant
    const u2 = await signup(app, randEmail()); // participant
    const u3 = await signup(app, randEmail()); // outsider

    // Create private conversation between u1 and u2
    const conv = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);
    const conversationId = conv.body.id as string;

    const msg = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ contentType: 'text', content: 'secret' })
      .expect(201);
    const messageId = msg.body.id as string;

    // List by outsider -> 403
    await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u3.accessToken}`)
      .expect(403);

    // Create by outsider -> 403
    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u3.accessToken}`)
      .send({ contentType: 'text', content: 'should not pass' })
      .expect(403);

    // Mark read by outsider -> 403
    await request(app.getHttpServer())
      .post(`/api/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${u3.accessToken}`)
      .expect(403);

    // Get statuses by outsider -> 403
    await request(app.getHttpServer())
      .get(`/api/messages/${messageId}/status`)
      .set('Authorization', `Bearer ${u3.accessToken}`)
      .expect(403);
  });
});
