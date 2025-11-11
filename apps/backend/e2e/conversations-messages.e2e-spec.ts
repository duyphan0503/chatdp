import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

// Helper to create a random email
function randEmail() {
  return `user_${Math.random().toString(36).slice(2)}@test.io`;
}

async function signup(app: INestApplication, email: string) {
  const password = 'secretpw';
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email, password, displayName: 'Tester' })
    .expect(201);
  return { accessToken: res.body.accessToken as string, refreshToken: res.body.refreshToken as string, userId: res.body.user.id as string };
}

describe('Conversations & Messages (e2e)', () => {
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

  it('private conversation lifecycle + messaging', async () => {
    // Sign up two users
    const u1 = await signup(app, randEmail());
    const u2 = await signup(app, randEmail());

    // Create private conversation from user1 to user2
    const convCreate = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ type: 'private', participantUserIds: [u2.userId] })
      .expect(201);
    const conversationId = convCreate.body.id as string;

    // List conversations for user1 should include the new private conversation
    const convList1 = await request(app.getHttpServer())
      .get('/api/conversations')
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .expect(200);
    expect(convList1.body.find((c: any) => c.id === conversationId)).toBeDefined();

    // User1 sends a text message
    const msgCreate = await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u1.accessToken}`)
      .send({ contentType: 'text', content: 'hello world' })
      .expect(201);
    const messageId = msgCreate.body.id as string;

    // List messages for user2 (should see the delivered message) and then mark as read
    const msgListU2 = await request(app.getHttpServer())
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .expect(200);
    // After pagination change messages list returns { items, nextCursor }
    expect(msgListU2.body.items[0].id).toBe(messageId);

    // Mark as read
    const markRead = await request(app.getHttpServer())
      .post(`/api/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .expect(201);
    expect(markRead.body.status.status).toBe('read');

    // Fetch statuses
    const statuses = await request(app.getHttpServer())
      .get(`/api/messages/${messageId}/status`)
      .set('Authorization', `Bearer ${u2.accessToken}`)
      .expect(200);
    expect(Array.isArray(statuses.body)).toBe(true);
    expect(statuses.body.find((s: any) => s.userId === u2.userId)).toBeDefined();
  });
});
