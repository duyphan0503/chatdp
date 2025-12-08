import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import request from 'supertest';
import { io as Client, Socket } from 'socket.io-client';

function wsUrl(baseUrl: string): string {
  const u = new URL(baseUrl);
  u.pathname = '/ws';
  return u.toString();
}

jest.setTimeout(30000);

describe('Calls signaling (Phase 8) - negative cases (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects call:initiate when user is not a participant of conversation', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // Alice & Bob in a private conversation
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });
    expect(alice.status).toBe(201);
    expect(bob.status).toBe(201);

    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.body.accessToken}`)
      .send({ type: 'private', participantUserIds: [bob.body.user.id] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // Charlie is not a participant
    const charlie = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `charlie_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Charlie',
      });
    expect(charlie.status).toBe(201);

    const url = wsUrl(baseUrl);
    const charlieSocket: Socket = Client(url, { transports: ['websocket'] });
    await new Promise<void>((resolve) => charlieSocket.on('connect', () => resolve()));

    const authed = new Promise<void>((resolve) =>
      charlieSocket.on('authenticated', () => resolve()),
    );
    charlieSocket.emit('authenticate', { token: charlie.body.accessToken });
    await authed;

    const failed = new Promise<{ reason: string }>((resolve) =>
      charlieSocket.on('call:failed', (payload) => resolve(payload)),
    );

    charlieSocket.emit('call:initiate', { conversationId: convId, type: 'voice' });

    const res = await failed;
    expect(res.reason).toBe('not_participant');

    charlieSocket.disconnect();
  });

  it('rate limits excessive call:initiate events for a single user', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });
    expect(alice.status).toBe(201);
    expect(bob.status).toBe(201);

    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.body.accessToken}`)
      .send({ type: 'private', participantUserIds: [bob.body.user.id] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    const url = wsUrl(baseUrl);
    const aliceSocket: Socket = Client(url, { transports: ['websocket'] });
    await new Promise<void>((resolve) => aliceSocket.on('connect', () => resolve()));

    const authed = new Promise<void>((resolve) => aliceSocket.on('authenticated', () => resolve()));
    aliceSocket.emit('authenticate', { token: alice.body.accessToken });
    await authed;

    const rateEvent = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => {
        if (payload.event === 'call:initiate') resolve(payload);
      }),
    );

    // Spam multiple call:initiate events; after enough attempts the per-user
    // rate limiter should emit `rate:limit` for call:initiate.
    for (let i = 0; i < 40; i++) {
      aliceSocket.emit('call:initiate', { conversationId: convId, type: 'voice' });
    }

    const ratePayload = await rateEvent;
    expect(ratePayload.event).toBe('call:initiate');
    expect(ratePayload.retryAfterMs).toBeGreaterThan(0);

    aliceSocket.disconnect();
  });
});
