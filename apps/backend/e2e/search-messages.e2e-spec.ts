import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

function randEmail() {
  return `user_${Math.random().toString(36).slice(2)}@test.io`;
}

describe('Search messages (e2e)', () => {
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

  it('searches messages within authorized conversations only', async () => {
    const password = 'secretpw';

    // Signup Alice and Bob
    const aliceSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Alice' })
      .expect(201);
    const bobSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Bob' })
      .expect(201);

    const aliceToken = aliceSignup.body.accessToken as string;
    const bobToken = bobSignup.body.accessToken as string;
    const bobId = bobSignup.body.user.id as string;

    // Create private conversation Alice <-> Bob
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] })
      .expect(201);
    const conversationId = convRes.body.id as string;

    // Alice sends some messages containing the word "hello"
    const send = async (content: string) => {
      await request(app.getHttpServer())
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ contentType: 'text', content })
        .expect(201);
    };

    await send('hello first');
    await send('this is another hello message');
    await send('other text without keyword');

    // Bob performs a search for "hello" (should see only messages in this conversation)
    const searchRes = await request(app.getHttpServer())
      .get('/api/search/messages')
      .set('Authorization', `Bearer ${bobToken}`)
      .query({ q: 'hello' })
      .expect(200);

    expect(Array.isArray(searchRes.body.items)).toBe(true);
    expect(searchRes.body.items.length).toBeGreaterThanOrEqual(2);
    for (const item of searchRes.body.items as any[]) {
      expect(item.conversationId).toBe(conversationId);
      expect(typeof item.rank).toBe('number');
    }
  });

  it('does not leak messages from conversations the user is not a participant of', async () => {
    const password = 'secretpw';

    // Signup Alice, Bob and Charlie
    const aliceSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Alice' })
      .expect(201);
    const bobSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Bob' })
      .expect(201);
    const charlieSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Charlie' })
      .expect(201);

    const aliceToken = aliceSignup.body.accessToken as string;
    const bobId = bobSignup.body.user.id as string;
    const charlieToken = charlieSignup.body.accessToken as string;

    // Alice <-> Bob conversation with a message containing "secret-keyword"
    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] })
      .expect(201);
    const conversationId = convRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ contentType: 'text', content: 'this has secret-keyword in it' })
      .expect(201);

    // Charlie (not a participant) searches for secret-keyword -> should get empty result
    const searchRes = await request(app.getHttpServer())
      .get('/api/search/messages')
      .set('Authorization', `Bearer ${charlieToken}`)
      .query({ q: 'secret-keyword' })
      .expect(200);

    expect(Array.isArray(searchRes.body.items)).toBe(true);
    expect(searchRes.body.items.length).toBe(0);
  });

  it('supports limit and nextCursor pagination', async () => {
    const password = 'secretpw';

    const aliceSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Alice' })
      .expect(201);
    const bobSignup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: randEmail(), password, displayName: 'Bob' })
      .expect(201);

    const aliceToken = aliceSignup.body.accessToken as string;
    const bobToken = bobSignup.body.accessToken as string;
    const bobId = bobSignup.body.user.id as string;

    const convRes = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] })
      .expect(201);
    const conversationId = convRes.body.id as string;
    // Create >10 messages containing the same keyword
    for (let i = 0; i < 12; i++) {
      // Small delay between requests to avoid tripping any HTTP rate limiting in tests
      await new Promise((resolve) => setTimeout(resolve, 25));

      await request(app.getHttpServer())
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ contentType: 'text', content: `hello #${i}` })
        .expect(201);
    }

    // First page with limit=5

    const firstPage = await request(app.getHttpServer())
      .get('/api/search/messages')
      .set('Authorization', `Bearer ${bobToken}`)
      .query({ q: 'hello', limit: 5 })
      .expect(200);

    expect(firstPage.body.items.length).toBeLessThanOrEqual(5);

    const nextCursor = firstPage.body.nextCursor as string | undefined;
    expect(typeof nextCursor === 'string' || nextCursor === undefined).toBe(true);

    if (nextCursor) {
      const secondPage = await request(app.getHttpServer())
        .get('/api/search/messages')
        .set('Authorization', `Bearer ${bobToken}`)
        .query({ q: 'hello', limit: 5, cursor: nextCursor })
        .expect(200);

      // Ensure no overlap between first and second page ids
      const firstIds = new Set((firstPage.body.items as any[]).map((i) => i.id));
      for (const item of secondPage.body.items as any[]) {
        expect(firstIds.has(item.id)).toBe(false);
      }
    }
  });
});
