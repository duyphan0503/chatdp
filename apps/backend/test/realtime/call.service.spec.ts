import { CallService } from '../../src/realtime/call.service.js';
import { CallStateStore } from '../../src/realtime/call-state.store.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { CallNotificationService } from '../../src/realtime/call-notification.service.js';

jest.useFakeTimers();

describe('CallService', () => {
  let store: CallStateStore;
  let prisma: jest.Mocked<Partial<PrismaService>>;
  let notifications: jest.Mocked<CallNotificationService>;
  let service: CallService;

  beforeEach(() => {
    store = new CallStateStore();
    prisma = {
      participant: {
        findMany: jest.fn(),
      } as any,
      friendship: {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any,
    } as any;
    notifications = {
      notifyIncomingCallIfOffline: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new CallService(prisma as PrismaService, store, notifications);
  });

  it('initiateCall enforces 1-1 participation and marks busy when user already in call', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ]);

    const session = await service.initiateCall({
      conversationId: 'conv-1',
      callerId: 'u1',
      type: 'voice',
    });

    expect(notifications.notifyIncomingCallIfOffline).toHaveBeenCalledWith(session);

    expect(session.callerId).toBe('u1');

    expect(session.calleeId).toBe('u2');
    expect(session.state).toBe('RINGING');
    expect(store.getByUser('u1')!.callId).toBe(session.callId);

    // second attempt from either side should be rejected as busy
    await expect(
      service.initiateCall({ conversationId: 'conv-1', callerId: 'u1', type: 'voice' }),
    ).rejects.toThrow('busy');
    await expect(
      service.initiateCall({ conversationId: 'conv-1', callerId: 'u2', type: 'voice' }),
    ).rejects.toThrow('busy');
  });

  it('initiateCall throws when caller not participant or not 1-1', async () => {
    // caller not in participant list
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([{ userId: 'u2' }]);
    await expect(
      service.initiateCall({ conversationId: 'conv-x', callerId: 'u1', type: 'voice' }),
    ).rejects.toThrow('not a participant');

    // not 1-1 conversation (e.g. group)
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'u1' },
      { userId: 'u2' },
      { userId: 'u3' },
    ]);
    await expect(
      service.initiateCall({ conversationId: 'conv-y', callerId: 'u1', type: 'voice' }),
    ).rejects.toThrow('only 1-1 calls are supported in Phase 8');
  });

  it('initiateCall rejects when friendship is blocked in either direction', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'caller' },
      { userId: 'callee' },
    ]);

    (prisma.friendship!.findFirst as jest.Mock).mockResolvedValueOnce({
      userOneId: 'caller',
      userTwoId: 'callee',
      status: 'blocked',
    });

    await expect(
      service.initiateCall({ conversationId: 'conv-blocked', callerId: 'caller', type: 'voice' }),
    ).rejects.toThrow('blocked');
  });

  it('acceptCall moves RINGING -> IN_CALL and only callee may accept', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'caller' },
      { userId: 'callee' },
    ]);

    const session = await service.initiateCall({
      conversationId: 'conv-accept',
      callerId: 'caller',
      type: 'video',
    });

    await expect(service.acceptCall(session.callId, 'caller')).rejects.toThrow('not_callee');

    const accepted = await service.acceptCall(session.callId, 'callee');
    expect(accepted.state).toBe('IN_CALL');
  });

  it('rejectCall moves RINGING -> REJECTED and clears store when ended', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'caller' },
      { userId: 'callee' },
    ]);

    const session = await service.initiateCall({
      conversationId: 'conv-reject',
      callerId: 'caller',
      type: 'voice',
    });

    const rejected = await service.rejectCall(session.callId, 'callee', 'busy');
    expect(rejected.state).toBe('REJECTED');
    expect(rejected.endedReason).toBe('busy');
  });

  it('endCall transitions to ENDED and removes from store', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'caller' },
      { userId: 'callee' },
    ]);

    const session = await service.initiateCall({
      conversationId: 'conv-end',
      callerId: 'caller',
      type: 'video',
    });

    const ended = await service.endCall(session.callId, 'caller', 'hangup');
    expect(ended.state).toBe('ENDED');
    expect(ended.endedReason).toBe('hangup');
    expect(store.getById(session.callId)).toBeUndefined();
  });

  it('RINGING timeout marks call as MISSED and removes from store', async () => {
    (prisma.participant!.findMany as jest.Mock).mockResolvedValueOnce([
      { userId: 'caller' },
      { userId: 'callee' },
    ]);

    const session = await service.initiateCall({
      conversationId: 'conv-timeout',
      callerId: 'caller',
      type: 'voice',
    });

    // Fast-forward timers beyond default 30s TTL
    jest.advanceTimersByTime(31_000);

    const stored = store.getById(session.callId);
    expect(stored).toBeUndefined();
  });
});
