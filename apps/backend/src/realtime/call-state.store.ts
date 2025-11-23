import { Injectable } from '@nestjs/common';

export type CallType = 'voice' | 'video';

export type CallState = 'RINGING' | 'IN_CALL' | 'ENDED' | 'MISSED' | 'REJECTED' | 'BUSY';

export interface CallSession {
  callId: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  type: CallType;
  state: CallState;
  createdAt: Date;
  updatedAt: Date;
  endedReason?: string;
}

@Injectable()
export class CallStateStore {
  private readonly calls = new Map<string, CallSession>(); // callId -> session
  private readonly userToCall = new Map<string, string>(); // userId -> callId

  getById(callId: string): CallSession | undefined {
    return this.calls.get(callId);
  }

  getByUser(userId: string): CallSession | undefined {
    const callId = this.userToCall.get(userId);
    return callId ? this.calls.get(callId) : undefined;
  }

  create(session: CallSession): CallSession {
    this.calls.set(session.callId, session);
    this.userToCall.set(session.callerId, session.callId);
    this.userToCall.set(session.calleeId, session.callId);
    return session;
  }

  update(callId: string, patch: Partial<CallSession>): CallSession | undefined {
    const current = this.calls.get(callId);
    if (!current) return undefined;
    const next: CallSession = { ...current, ...patch, updatedAt: new Date() };
    this.calls.set(callId, next);
    return next;
  }

  remove(callId: string): void {
    const session = this.calls.get(callId);
    if (!session) return;
    this.calls.delete(callId);
    this.userToCall.delete(session.callerId);
    this.userToCall.delete(session.calleeId);
  }

  clearAll(): void {
    this.calls.clear();
    this.userToCall.clear();
  }
}
