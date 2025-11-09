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

describe('RealtimeGateway negative cases (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    // Lower WS rate limit for faster tests
    process.env.WS_RATE_LIMIT_TTL = '2'; // seconds
    process.env.WS_RATE_LIMIT_LIMIT = '2'; // allow 2 events within window
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

  it('rate limits excessive typing events', async () => {
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
    const joined = new Promise<void>((resolve) => aliceSocket.on('conversation:joined', () => resolve()));
    aliceSocket.emit('conversation:join', { conversationId: convId });
    await joined;

    const rateEvent = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => resolve(payload)),
    );

    // Emit typing more than limit (limit=2 set above)
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    await new Promise((r) => setTimeout(r, 20));
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    await new Promise((r) => setTimeout(r, 20));
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true }); // should be limited

    const ratePayload = await Promise.race([
      rateEvent,
      new Promise<{ event: string; retryAfterMs: number }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout waiting for first rate:limit typing')), 5000),
      ),
    ]);
    expect(ratePayload.event).toBe('typing');
    expect(ratePayload.retryAfterMs).toBeGreaterThan(0);

    // Wait for window reset (TTL=2s)
    await new Promise((r) => setTimeout(r, 2100)); // TTL (2s) + 100ms buffer

    aliceSocket.disconnect();
  });

  it('rate limits excessive message:new events after window reset', async () => {
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
    const joined = new Promise<void>((resolve) => aliceSocket.on('conversation:joined', () => resolve()));
    aliceSocket.emit('conversation:join', { conversationId: convId });
    await joined;

    // pre-rate limit typing to ensure window mechanics working
    const rateEventTyping = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => payload.event === 'typing' && resolve(payload)),
    );
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    aliceSocket.emit('typing', { conversationId: convId, isTyping: true });
    const typingRatePayload = await Promise.race([
      rateEventTyping,
      new Promise<{ event: string; retryAfterMs: number }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout waiting for typing rate limit (setup)')), 5000),
      ),
    ]);
    expect(typingRatePayload.event).toBe('typing');

    // Wait for window reset (TTL=2s)
    await new Promise((r) => setTimeout(r, 2100));

    const rateEventMessage = new Promise<{ event: string; retryAfterMs: number }>((resolve) =>
      aliceSocket.on('rate:limit', (payload) => payload.event === 'message:new' && resolve(payload)),
    );

    aliceSocket.emit('message:new', { conversationId: convId, contentType: 'text', content: 'one' });
    aliceSocket.emit('message:new', { conversationId: convId, contentType: 'text', content: 'two' });
    aliceSocket.emit('message:new', { conversationId: convId, contentType: 'text', content: 'three' });

    const messageRatePayload = await Promise.race([
      rateEventMessage,
      new Promise<{ event: string; retryAfterMs: number }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout waiting for message:new rate limit')), 5000),
      ),
    ]);
    expect(messageRatePayload.event).toBe('message:new');

    aliceSocket.disconnect();
  });
});
