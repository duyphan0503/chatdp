import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import request from 'supertest';
import { io as Client, Socket } from 'socket.io-client';

function wsUrl(baseUrl: string): string {
  // baseUrl like http://127.0.0.1:34567
  const u = new URL(baseUrl);
  u.pathname = '/ws';
  return u.toString();
}

jest.setTimeout(15000);

describe('RealtimeGateway (e2e)', () => {
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

  it('authenticates socket and sends/reads messages', async () => {
    // 1) Signup two users
    const rand = () => Math.random().toString(36).slice(2);
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    expect(alice.status).toBe(201);
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });
    expect(bob.status).toBe(201);

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const aliceId = alice.body.user.id as string;
    const bobId = bob.body.user.id as string;

    // 2) Create conversation and add both as participants via HTTP
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // Private conversation already includes both users; joining not required

    // 3) Connect sockets and authenticate
    const url = wsUrl(baseUrl);
    const aliceSocket: Socket = Client(url, { transports: ['websocket'] });
    const bobSocket: Socket = Client(url, { transports: ['websocket'] });

    await new Promise<void>((resolve) => aliceSocket.on('connect', () => resolve()));
    await new Promise<void>((resolve) => bobSocket.on('connect', () => resolve()));

    const authedAlice = new Promise<void>((resolve) =>
      aliceSocket.on('authenticated', () => resolve()),
    );
    aliceSocket.emit('authenticate', { token: aliceToken });

    const authedBob = new Promise<void>((resolve) =>
      bobSocket.on('authenticated', () => resolve()),
    );
    bobSocket.emit('authenticate', { token: bobToken });

    await authedAlice;
    await authedBob;

    // 4) Join conversation room sequentially to assert presence events
    const aliceJoined = new Promise<void>((resolve) =>
      aliceSocket.on('conversation:joined', () => resolve()),
    );
    aliceSocket.emit('conversation:join', { conversationId: convId });
    await aliceJoined;

    // Alice listens for Bob's presence going online upon his join
    const bobOnlineAtAlice = new Promise<{ userId: string }>((resolve) =>
      aliceSocket.on('presence:online', (p: { userId: string }) => resolve(p)),
    );

    const bobJoined = new Promise<void>((resolve) =>
      bobSocket.on('conversation:joined', () => resolve()),
    );
    bobSocket.emit('conversation:join', { conversationId: convId });
    await bobJoined;

    const pOnline = await bobOnlineAtAlice;
    expect(pOnline.userId).toBe(bobId);

    // 5) Bob listens for new message
    const gotMessage = new Promise<{ message: any }>((resolve) =>
      bobSocket.on('message:new', (payload: { message: any }) => resolve(payload)),
    );

    // 6) Alice sends a message
    aliceSocket.emit('message:new', {
      conversationId: convId,
      contentType: 'text',
      content: 'hello Bob',
    });

    const payload = await gotMessage;
    expect(payload.message.content).toBe('hello Bob');

    // 7) Bob marks read and Alice should see read event
    const readEvent = new Promise<{ messageId: string; userId: string }>((resolve) =>
      aliceSocket.on('message:read', (data: { messageId: string; userId: string }) =>
        resolve(data),
      ),
    );

    const messageId = payload.message.id as string;
    bobSocket.emit('message:read', { messageId });

    const read = await readEvent;
    expect(read.messageId).toBe(messageId);
    expect(read.userId).toBe(bobId);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('handles reactions and delete over websocket', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // Signup two users
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    expect(alice.status).toBe(201);
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });
    expect(bob.status).toBe(201);

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const bobId = bob.body.user.id as string;

    // Create conversation
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // Connect sockets and authenticate
    const url = wsUrl(baseUrl);
    const aliceSocket: Socket = Client(url, { transports: ['websocket'] });
    const bobSocket: Socket = Client(url, { transports: ['websocket'] });

    await new Promise<void>((resolve) => aliceSocket.on('connect', () => resolve()));
    await new Promise<void>((resolve) => bobSocket.on('connect', () => resolve()));

    const authedAlice = new Promise<void>((resolve) =>
      aliceSocket.on('authenticated', () => resolve()),
    );
    aliceSocket.emit('authenticate', { token: aliceToken });

    const authedBob = new Promise<void>((resolve) =>
      bobSocket.on('authenticated', () => resolve()),
    );
    bobSocket.emit('authenticate', { token: bobToken });

    await authedAlice;
    await authedBob;

    // Join conversation
    const aliceJoined = new Promise<void>((resolve) =>
      aliceSocket.on('conversation:joined', () => resolve()),
    );
    aliceSocket.emit('conversation:join', { conversationId: convId });
    await aliceJoined;

    const bobJoined = new Promise<void>((resolve) =>
      bobSocket.on('conversation:joined', () => resolve()),
    );
    bobSocket.emit('conversation:join', { conversationId: convId });
    await bobJoined;

    // Alice sends a message, Bob receives it
    const gotMessage = new Promise<{ message: any }>((resolve) =>
      bobSocket.on('message:new', (payload: { message: any }) => resolve(payload)),
    );

    aliceSocket.emit('message:new', {
      conversationId: convId,
      contentType: 'text',
      content: 'hello Bob',
    });

    const payload = await gotMessage;
    const messageId = payload.message.id as string;

    // Bob adds a reaction, Alice observes event
    const reactionAdded = new Promise<{ messageId: string; emoji: string; userId: string }>(
      (resolve) =>
        aliceSocket.on(
          'message:reaction_added',
          (data: { messageId: string; emoji: string; userId: string }) => resolve(data),
        ),
    );

    bobSocket.emit('message:reaction_add', { messageId, emoji: '👍' });

    const added = await reactionAdded;
    expect(added.messageId).toBe(messageId);
    expect(added.emoji).toBe('👍');
    expect(added.userId).toBe(bobId);

    // Bob removes the reaction, Alice observes event
    const reactionRemoved = new Promise<{
      messageId: string;
      emoji: string;
      userId: string;
    }>((resolve) =>
      aliceSocket.on(
        'message:reaction_removed',
        (data: { messageId: string; emoji: string; userId: string }) => resolve(data),
      ),
    );

    bobSocket.emit('message:reaction_remove', { messageId, emoji: '👍' });

    const removed = await reactionRemoved;
    expect(removed.messageId).toBe(messageId);
    expect(removed.emoji).toBe('👍');
    expect(removed.userId).toBe(bobId);

    // Alice deletes her own message, Bob observes deleted event
    const messageDeleted = new Promise<{
      messageId: string;
      conversationId: string;
      deletedAt: string;
      senderId: string;
    }>((resolve) =>
      bobSocket.on(
        'message:deleted',
        (data: { messageId: string; conversationId: string; deletedAt: string; senderId: string }) =>
          resolve(data),
      ),
    );

    aliceSocket.emit('message:delete', { messageId });

    const deleted = await messageDeleted;
    expect(deleted.messageId).toBe(messageId);
    expect(deleted.conversationId).toBe(convId);
    expect(typeof deleted.deletedAt).toBe('string');

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });
});
