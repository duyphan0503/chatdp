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

describe('Calls signaling (Phase 8) - positive flow (e2e)', () => {
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

  it('runs a full call flow: initiate -> accept -> end', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // 1) Signup Alice & Bob
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

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const aliceId = alice.body.user.id as string;
    const bobId = bob.body.user.id as string;

    // 2) Create a private conversation between Alice and Bob
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // 3) Connect sockets & authenticate
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

    // 4) Alice initiates call, Bob receives incoming
    const incomingPromise = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      type: string;
    }>((resolve) => bobSocket.on('call:incoming', (p) => resolve(p)));
    const initiatedPromise = new Promise<{
      callId: string;
      conversationId: string;
      calleeUserId: string;
      type: string;
    }>((resolve) => aliceSocket.on('call:initiated', (p) => resolve(p)));

    aliceSocket.emit('call:initiate', {
      conversationId: convId,
      type: 'voice',
    });

    const incoming = await incomingPromise;
    const initiated = await initiatedPromise;

    expect(incoming.conversationId).toBe(convId);
    expect(incoming.fromUserId).toBe(aliceId);
    expect(incoming.type).toBe('voice');

    expect(initiated.conversationId).toBe(convId);
    expect(initiated.calleeUserId).toBe(bobId);
    expect(initiated.type).toBe('voice');

    const callId = incoming.callId;
    expect(callId).toBe(initiated.callId);

    // 5) Bob accepts the call
    const acceptedAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
    }>((resolve) => aliceSocket.on('call:accepted', (p) => resolve(p)));
    const acceptedAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
    }>((resolve) => bobSocket.on('call:accepted', (p) => resolve(p)));

    bobSocket.emit('call:accept', { callId });

    const acceptAlice = await acceptedAtAlice;
    const acceptBob = await acceptedAtBob;

    expect(acceptAlice.callId).toBe(callId);
    expect(acceptAlice.conversationId).toBe(convId);
    expect(acceptAlice.fromUserId).toBe(bobId);

    expect(acceptBob.callId).toBe(callId);
    expect(acceptBob.conversationId).toBe(convId);
    expect(acceptBob.fromUserId).toBe(bobId);

    // 6) Alice ends the call
    const endedAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => aliceSocket.on('call:ended', (p) => resolve(p)));
    const endedAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => bobSocket.on('call:ended', (p) => resolve(p)));

    aliceSocket.emit('call:end', { callId, reason: 'hangup' });

    const endAlice = await endedAtAlice;
    const endBob = await endedAtBob;

    expect(endAlice.callId).toBe(callId);
    expect(endAlice.conversationId).toBe(convId);
    expect(endAlice.fromUserId).toBe(aliceId);
    expect(endAlice.reason).toBe('hangup');

    expect(endBob.callId).toBe(callId);
    expect(endBob.conversationId).toBe(convId);
    expect(endBob.fromUserId).toBe(aliceId);
    expect(endBob.reason).toBe('hangup');

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('allows callee to reject a ringing call', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // 1) Signup Alice & Bob
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_reject_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_reject_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });

    expect(alice.status).toBe(201);
    expect(bob.status).toBe(201);

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const aliceId = alice.body.user.id as string;
    const bobId = bob.body.user.id as string;

    // 2) Create a private conversation between Alice and Bob
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // 3) Connect sockets & authenticate
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

    // 4) Alice initiates call, Bob receives incoming
    const incomingPromise = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      type: string;
    }>((resolve) => bobSocket.on('call:incoming', (p) => resolve(p)));
    const initiatedPromise = new Promise<{
      callId: string;
      conversationId: string;
      calleeUserId: string;
      type: string;
    }>((resolve) => aliceSocket.on('call:initiated', (p) => resolve(p)));

    aliceSocket.emit('call:initiate', {
      conversationId: convId,
      type: 'voice',
    });

    const incoming = await incomingPromise;
    const initiated = await initiatedPromise;

    expect(incoming.conversationId).toBe(convId);
    expect(incoming.fromUserId).toBe(aliceId);
    expect(incoming.type).toBe('voice');

    expect(initiated.conversationId).toBe(convId);
    expect(initiated.calleeUserId).toBe(bobId);
    expect(initiated.type).toBe('voice');

    const callId = incoming.callId;
    expect(callId).toBe(initiated.callId);

    // 5) Bob rejects the call while RINGING
    const rejectedAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => aliceSocket.on('call:rejected', (p) => resolve(p)));
    const rejectedAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => bobSocket.on('call:rejected', (p) => resolve(p)));

    bobSocket.emit('call:reject', { callId, reason: 'busy' });

    const rejectAlice = await rejectedAtAlice;
    const rejectBob = await rejectedAtBob;

    expect(rejectAlice.callId).toBe(callId);
    expect(rejectAlice.conversationId).toBe(convId);
    expect(rejectAlice.fromUserId).toBe(bobId);
    expect(rejectAlice.reason).toBe('busy');

    expect(rejectBob.callId).toBe(callId);
    expect(rejectBob.conversationId).toBe(convId);
    expect(rejectBob.fromUserId).toBe(bobId);
    expect(rejectBob.reason).toBe('busy');

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('allows caller to cancel a ringing call', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // 1) Signup Alice & Bob
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_cancel_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_cancel_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });

    expect(alice.status).toBe(201);
    expect(bob.status).toBe(201);

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const aliceId = alice.body.user.id as string;
    const bobId = bob.body.user.id as string;

    // 2) Create a private conversation between Alice and Bob
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // 3) Connect sockets & authenticate
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

    // 4) Alice initiates call, Bob receives incoming
    const incomingPromise = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      type: string;
    }>((resolve) => bobSocket.on('call:incoming', (p) => resolve(p)));
    const initiatedPromise = new Promise<{
      callId: string;
      conversationId: string;
      calleeUserId: string;
      type: string;
    }>((resolve) => aliceSocket.on('call:initiated', (p) => resolve(p)));

    aliceSocket.emit('call:initiate', {
      conversationId: convId,
      type: 'voice',
    });

    const incoming = await incomingPromise;
    const initiated = await initiatedPromise;

    expect(incoming.conversationId).toBe(convId);
    expect(incoming.fromUserId).toBe(aliceId);
    expect(incoming.type).toBe('voice');

    expect(initiated.conversationId).toBe(convId);
    expect(initiated.calleeUserId).toBe(bobId);
    expect(initiated.type).toBe('voice');

    const callId = incoming.callId;
    expect(callId).toBe(initiated.callId);

    // 5) Alice cancels the call while RINGING
    const rejectedAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => aliceSocket.on('call:rejected', (p) => resolve(p)));
    const rejectedAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      reason: string;
    }>((resolve) => bobSocket.on('call:rejected', (p) => resolve(p)));

    aliceSocket.emit('call:reject', { callId, reason: 'cancel' });

    const rejectAlice = await rejectedAtAlice;
    const rejectBob = await rejectedAtBob;

    expect(rejectAlice.callId).toBe(callId);
    expect(rejectAlice.conversationId).toBe(convId);
    expect(rejectAlice.fromUserId).toBe(aliceId);
    expect(rejectAlice.reason).toBe('cancel');

    expect(rejectBob.callId).toBe(callId);
    expect(rejectBob.conversationId).toBe(convId);
    expect(rejectBob.fromUserId).toBe(aliceId);
    expect(rejectBob.reason).toBe('cancel');

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('relays ICE candidates to both peers', async () => {
    const rand = () => Math.random().toString(36).slice(2);

    // 1) Signup Alice & Bob
    const alice = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `alice_ice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Alice',
      });
    const bob = await request(baseUrl)
      .post('/api/auth/signup')
      .send({
        email: `bob_ice_${rand()}@example.com`,
        password: 'StrongPassw0rd!',
        displayName: 'Bob',
      });

    expect(alice.status).toBe(201);
    expect(bob.status).toBe(201);

    const aliceToken = alice.body.accessToken as string;
    const bobToken = bob.body.accessToken as string;
    const aliceId = alice.body.user.id as string;
    const bobId = bob.body.user.id as string;

    // 2) Create a private conversation between Alice and Bob
    const convRes = await request(baseUrl)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ type: 'private', participantUserIds: [bobId] });
    expect(convRes.status).toBe(201);
    const convId = convRes.body.id as string;

    // 3) Connect sockets & authenticate
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

    // 4) Alice initiates and Bob accepts the call
    const incomingPromise = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      type: string;
    }>((resolve) => bobSocket.on('call:incoming', (p) => resolve(p)));
    const initiatedPromise = new Promise<{
      callId: string;
      conversationId: string;
      calleeUserId: string;
      type: string;
    }>((resolve) => aliceSocket.on('call:initiated', (p) => resolve(p)));

    aliceSocket.emit('call:initiate', {
      conversationId: convId,
      type: 'video',
    });

    const incoming = await incomingPromise;
    const initiated = await initiatedPromise;

    const callId = incoming.callId;
    expect(callId).toBe(initiated.callId);

    const acceptedAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
    }>((resolve) => aliceSocket.on('call:accepted', (p) => resolve(p)));
    const acceptedAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
    }>((resolve) => bobSocket.on('call:accepted', (p) => resolve(p)));

    bobSocket.emit('call:accept', { callId });

    const acceptAlice = await acceptedAtAlice;
    const acceptBob = await acceptedAtBob;

    expect(acceptAlice.callId).toBe(callId);
    expect(acceptAlice.conversationId).toBe(convId);
    expect(acceptAlice.fromUserId).toBe(bobId);

    expect(acceptBob.callId).toBe(callId);
    expect(acceptBob.conversationId).toBe(convId);
    expect(acceptBob.fromUserId).toBe(bobId);

    // 5) Alice sends ICE candidate and both peers receive it
    const candidatePayload = {
      sdpMid: '0',
      sdpMLineIndex: 0,
      candidate: 'candidate:1 1 udp 2122260223 192.0.2.1 54400 typ host',
    };

    const candidateAtAlice = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      candidate: any;
    }>((resolve) => aliceSocket.on('call:ice_candidate', (p) => resolve(p)));
    const candidateAtBob = new Promise<{
      callId: string;
      conversationId: string;
      fromUserId: string;
      candidate: any;
    }>((resolve) => bobSocket.on('call:ice_candidate', (p) => resolve(p)));

    aliceSocket.emit('call:ice_candidate', { callId, candidate: candidatePayload });

    const iceAlice = await candidateAtAlice;
    const iceBob = await candidateAtBob;

    expect(iceAlice.callId).toBe(callId);
    expect(iceAlice.conversationId).toBe(convId);
    expect(iceAlice.fromUserId).toBe(aliceId);
    expect(iceAlice.candidate).toEqual(candidatePayload);

    expect(iceBob.callId).toBe(callId);
    expect(iceBob.conversationId).toBe(convId);
    expect(iceBob.fromUserId).toBe(aliceId);
    expect(iceBob.candidate).toEqual(candidatePayload);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });
});
