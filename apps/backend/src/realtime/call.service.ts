import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CallStateStore, CallSession, CallType } from './call-state.store.js';
import { CallNotificationService } from './call-notification.service.js';
import { randomUUID } from 'node:crypto';
import {
  callsAcceptedTotal,
  callsInitiatedTotal,
  callsMissedTotal,
  callsRejectedTotal,
} from '../metrics/metrics.service.js';

@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);

  /**
   * Basic RINGING timeout in milliseconds.
   *
   * Behavior:
   * - When a call is created in RINGING state, a timeout is scheduled.
   * - If the call is still RINGING when the timeout fires, it is marked MISSED
   *   with reason "timeout" and removed from the in-memory store.
   *
   * In-memory and per-process only (sufficient for Phase 8).
   */
  private readonly ringingTtlMs = 30_000; // 30 seconds

  /**
   * Per-call timeout handles so we can cancel timeouts on accept/reject/end.
   */
  private readonly ringingTimers = new Map<string, ReturnType<typeof setTimeout>>();
 
  constructor(
    private readonly prisma: PrismaService,
    private readonly calls: CallStateStore,
    private readonly notifications: CallNotificationService,
  ) {}


  /**
   * Initiate a 1-1 call for the given conversation and caller.
   * Phase 8: only supports private (two-participant) conversations.
   */
  async initiateCall(params: {
    conversationId: string;
    callerId: string;
    type: CallType;
  }): Promise<CallSession> {
    const { conversationId, callerId, type } = params;

    // Ensure caller is a participant and conversation is 1-1
    const participants = await this.prisma.participant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const userIds = participants.map((p) => p.userId);
    if (!userIds.includes(callerId)) {
      throw new Error('not a participant');
    }
    if (userIds.length !== 2) {
      throw new Error('only 1-1 calls are supported in Phase 8');
    }
    const calleeId = userIds.find((id) => id !== callerId)!;

    // AuthZ: respect Friendship.blocked in either direction (if any).
    const blocked = await this.prisma.friendship.findFirst({
      where: {
        status: 'blocked',
        OR: [
          { userOneId: callerId, userTwoId: calleeId },
          { userOneId: calleeId, userTwoId: callerId },
        ],
      },
      select: { userOneId: true, userTwoId: true },
    });
    if (blocked) {
      this.logger.debug(
        `Call between caller=${callerId} and callee=${calleeId} blocked by friendship relation`,
      );
      throw new Error('blocked');
    }
 
    // Busy check: one active call per user
    if (this.calls.getByUser(callerId) || this.calls.getByUser(calleeId)) {
      throw new Error('busy');
    }


    const now = new Date();
    const session: CallSession = {
      callId: randomUUID(),
      conversationId,
      callerId,
      calleeId,
      type,
      state: 'RINGING',
      createdAt: now,
      updatedAt: now,
    };
 
    this.calls.create(session);
    try {
      callsInitiatedTotal.labels(type).inc(1);
    } catch {
      // ignore metrics errors
    }
    this.logger.debug(
      `Created call ${session.callId} (caller=${callerId}, callee=${calleeId}, conv=${conversationId})`,
    );

    // Fire-and-forget notification hook for offline callee.
    void this.notifications.notifyIncomingCallIfOffline(session);
 
    // Schedule automatic timeout for unanswered calls.
    this.scheduleRingingTimeout(session.callId);
 
    return session;

  }

  getSession(callId: string): CallSession | undefined {
    return this.calls.getById(callId);
  }

  async acceptCall(callId: string, userId: string): Promise<CallSession> {
    const session = this.calls.getById(callId);
    if (!session) {
      throw new Error('call_not_found');
    }
    if (session.state !== 'RINGING') {
      throw new Error('invalid_state');
    }
    if (session.calleeId !== userId) {
      throw new Error('not_callee');
    }

    this.clearRingingTimeout(callId);
    const updated = this.calls.update(callId, { state: 'IN_CALL' });
    try {
      callsAcceptedTotal.inc(1);
    } catch {
      // ignore metrics errors
    }
    this.logger.debug(`Call ${callId} accepted by user=${userId}`);
    return updated!;
  }

  async rejectCall(callId: string, userId: string, reason?: string): Promise<CallSession> {
    const session = this.calls.getById(callId);
    if (!session) {
      throw new Error('call_not_found');
    }
    if (session.state !== 'RINGING') {
      throw new Error('invalid_state');
    }
    if (session.calleeId !== userId && session.callerId !== userId) {
      throw new Error('not_participant');
    }

    this.clearRingingTimeout(callId);
    const updated = this.calls.update(callId, {
      state: 'REJECTED',
      endedReason: reason ?? 'rejected',
    });
    try {
      callsRejectedTotal.inc(1);
    } catch {
      // ignore metrics errors
    }
    this.logger.debug(`Call ${callId} rejected by user=${userId}, reason=${reason ?? 'rejected'}`);
    return updated!;
  }

  async endCall(callId: string, userId: string, reason?: string): Promise<CallSession> {
    const session = this.calls.getById(callId);
    if (!session) {
      throw new Error('call_not_found');
    }
    if (session.calleeId !== userId && session.callerId !== userId) {
      throw new Error('not_participant');
    }

    this.clearRingingTimeout(callId);
    const updated = this.calls.update(callId, {
      state: 'ENDED',
      endedReason: reason ?? 'hangup',
    });
    this.logger.debug(`Call ${callId} ended by user=${userId}, reason=${reason ?? 'hangup'}`);

    // For now, remove immediately from in-memory store.
    this.calls.remove(callId);

    return updated!;
  }

  private scheduleRingingTimeout(callId: string): void {
    this.clearRingingTimeout(callId);

    const handle = setTimeout(() => {
      this.handleRingingTimeout(callId).catch((err) => {
        this.logger.warn(
          `Error handling ringing timeout for call=${callId}: ${(err as Error).message}`,
        );
      });
    }, this.ringingTtlMs);

    this.ringingTimers.set(callId, handle);
  }

  private clearRingingTimeout(callId: string): void {
    const handle = this.ringingTimers.get(callId);
    if (handle) {
      clearTimeout(handle);
      this.ringingTimers.delete(callId);
    }
  }

  private async handleRingingTimeout(callId: string): Promise<void> {
    const session = this.calls.getById(callId);
    if (!session) return;
    if (session.state !== 'RINGING') return;

    this.logger.debug(
      `RINGING timeout reached for call=${callId}; marking as MISSED and cleaning up.`,
    );
    try {
      callsMissedTotal.inc(1);
    } catch {
      // ignore metrics errors
    }
    this.calls.update(callId, { state: 'MISSED', endedReason: 'timeout' });
    this.calls.remove(callId);
    this.clearRingingTimeout(callId);
  }
}
