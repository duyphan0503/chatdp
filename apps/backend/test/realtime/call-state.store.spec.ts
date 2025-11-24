import { CallStateStore, type CallSession } from '../../src/realtime/call-state.store.js';

describe('CallStateStore', () => {
  let store: CallStateStore;

  beforeEach(() => {
    store = new CallStateStore();
  });

  it('creates and retrieves sessions by id and user', () => {
    const session: CallSession = {
      callId: 'call-1',
      conversationId: 'conv-1',
      callerId: 'u1',
      calleeId: 'u2',
      type: 'voice',
      state: 'RINGING',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    };

    store.create(session);

    expect(store.getById('call-1')).toMatchObject({
      callId: 'call-1',
      callerId: 'u1',
      calleeId: 'u2',
    });
    expect(store.getByUser('u1')!.callId).toBe('call-1');
    expect(store.getByUser('u2')!.callId).toBe('call-1');
  });

  it('update patches session and bumps updatedAt', () => {
    const created = store.create({
      callId: 'call-2',
      conversationId: 'conv-1',
      callerId: 'u1',
      calleeId: 'u2',
      type: 'video',
      state: 'RINGING',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const updated = store.update('call-2', { state: 'IN_CALL' })!;
    expect(updated.state).toBe('IN_CALL');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('remove deletes mapping for both users', () => {
    store.create({
      callId: 'call-3',
      conversationId: 'conv-1',
      callerId: 'u1',
      calleeId: 'u2',
      type: 'voice',
      state: 'RINGING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    store.remove('call-3');
    expect(store.getById('call-3')).toBeUndefined();
    expect(store.getByUser('u1')).toBeUndefined();
    expect(store.getByUser('u2')).toBeUndefined();
  });

  it('clearAll wipes all sessions and indices', () => {
    store.create({
      callId: 'call-4',
      conversationId: 'conv-1',
      callerId: 'u1',
      calleeId: 'u2',
      type: 'voice',
      state: 'RINGING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    store.create({
      callId: 'call-5',
      conversationId: 'conv-2',
      callerId: 'u3',
      calleeId: 'u4',
      type: 'video',
      state: 'RINGING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    store.clearAll();

    expect(store.getById('call-4')).toBeUndefined();
    expect(store.getById('call-5')).toBeUndefined();
    expect(store.getByUser('u1')).toBeUndefined();
    expect(store.getByUser('u4')).toBeUndefined();
  });
});
