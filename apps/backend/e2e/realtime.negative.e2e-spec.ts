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

jest.setTimeout(15000);

describe('RealtimeGateway negative cases (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    // Lower WS rate limit for faster tests
    process.env.WS_RATE_LIMIT_TTL = '5'; // seconds
    process.env.WS_RATE_LIMIT_LIMIT = '2';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects invalid authentication token', async () => { // timeout adjusted for potential slow disconnect
    const url = wsUrl(baseUrl);
    const sock: Socket = Client(url, { transports: ['websocket'] });
    await new Promise<void>((resolve) => sock.on('connect', () => resolve()));

    const unauthorizedEvent = new Promise<{ error: string }>((resolve) =>
      sock.on('unauthorized', (payload) => resolve(payload)),
    );

    sock.emit('authenticate', { token: 'not.a.jwt' });

    const res = await Promise.race([
      unauthorizedEvent,
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    expect(res).toBeTruthy();
    expect((res as any).error).toBe('invalid token');
    // Socket should disconnect shortly after; guard against flakiness
    await Promise.race([
      new Promise<void>((resolve) => sock.on('disconnect', () => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);
    if (sock.connected) sock.disconnect();
  });

  it('emits error when joining a conversation user is not participant of', async () => {
    // Create Alice & Bob and a private conversation between them
    const rand = () => Math.random().toString(36).slice(2);
    const alice = await request(baseUrl).post('/api/auth/signup').send({
      email: `alice_${rand()}@example.com`,
      password: 'StrongPassw0rd!',
      displayName: 'Alice',
    });
    const bob = await request(baseUrl).post('/api/auth/signup').send({
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

    // Create Charlie who is NOT part of the conversation
    const charlie = await request(baseUrl).post('/api/auth/signup').send({
      email: `charlie_${rand()}@example.com`,
      password: 'StrongPassw0rd!',
      displayName: 'Charlie',
    });
    expect(charlie.status).toBe(201);

    const url = wsUrl(baseUrl);
    const charlieSocket: Socket = Client(url, { transports: ['websocket'] });
    await new Promise<void>((resolve) => charlieSocket.on('connect', () => resolve()));

    const authed = new Promise<void>((resolve) => charlieSocket.on('authenticated', () => resolve()));
    charlieSocket.emit('authenticate', { token: charlie.body.accessToken });
    await authed;

    const errorEvent = new Promise<{ message: string }>((resolve) =>
      charlieSocket.on('error', (payload) => resolve(payload)),
    );

    charlieSocket.emit('conversation:join', { conversationId: convId });
    const errPayload = await errorEvent;
    expect(errPayload.message).toBe('not a participant');

    charlieSocket.disconnect();
  });

  it('rate limits excessive events (typing then message:new)', async () => {
    // Create two users & private conversation
    const rand = () => Math.random().toString(36).slice(2);
    const alice = await request(baseUrl).post('/api/auth/signup').send({
      email: `alice_${rand()}@example.com`,
      password: 'StrongPassw0rd!',
      displayName: 'Alice',
    });
    const bob = await request(baseUrl).post('/api/auth/signup').send({
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
    aliceSocket.emit('conversation:join', { conversationId: convId });

    const rateEvent = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => resolve(payload)),
    );

    // Emit typing more than limit (limit=2 set above)
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true }); // should be limited

    const ratePayload = await rateEvent;
    expect(ratePayload.event).toBe('typing');
    expect(ratePayload.retryAfterMs).toBeGreaterThan(0);

    // Wait for window reset (TTL=5s)
    await new Promise((r) => setTimeout(r, 2100)); // TTL (2s) + 100ms buffer

    // After window reset, first message:new events should succeed, then rate limit on third
    const secondRateEvent = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => resolve(payload)),
    );
    aliceSocket.emit('message:new', {
      conversationId: convId,
      contentType: 'text',
      content: 'one',
    });
    aliceSocket.emit('message:new', {
      conversationId: convId,
      contentType: 'text',
      content: 'two',
    });
    aliceSocket.emit('message:new', {
      conversationId: convId,
      contentType: 'text',
      content: 'three',
    }); // should trigger rate limit now

    const ratePayload2 = await secondRateEvent;
    expect(ratePayload2.event).toBe('message:new');

    aliceSocket.disconnect();
  });
});
