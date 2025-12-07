import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { CallService } from './call.service.js';
import type { CallType } from './call-state.store.js';
import { wsEventsTotal } from '../metrics/index.js';
import { CallInitiateDto } from './dto/call-initiate.dto.js';
import { CallAcceptDto } from './dto/call-accept.dto.js';
import { CallRejectDto } from './dto/call-reject.dto.js';
import { CallEndDto } from './dto/call-end.dto.js';
import { CallIceCandidateDto } from './dto/call-ice-candidate.dto.js';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket gateway responsible for WebRTC call signaling.
 *
 * Assumes that the MessagingGateway has already authenticated the socket and
 * populated client.data.userId. Exposes initiate/accept/reject/end and ICE
 * candidate events, applying basic per-user rate limiting.
 */
@WebSocketGateway({ namespace: '/ws', cors: { origin: true, credentials: true } })
@Injectable()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CallsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(CallsGateway.name);

  private readonly wsCallRateTtlMs: number;
  private readonly wsCallRateLimit: number;
  private readonly rateCounters = new Map<string, { windowStart: number; count: number }>();

  constructor(
    private readonly calls: CallService,
    private readonly config: ConfigService,
  ) {
    const ttlSecRaw = this.config.get<number>('WS_CALL_RATE_LIMIT_TTL', { infer: true });
    const limitRaw = this.config.get<number>('WS_CALL_RATE_LIMIT_LIMIT', { infer: true });
    const ttlSec = ttlSecRaw && ttlSecRaw > 0 ? ttlSecRaw : 60;
    const limit = limitRaw && limitRaw > 0 ? limitRaw : 30;
    this.wsCallRateTtlMs = ttlSec * 1000;
    this.wsCallRateLimit = limit;
  }

  afterInit(server: Server): void {
    this.server = server;
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Socket connected (calls namespace): ${client.id}`);
    this.incWs('connection');
  }

  // Client -> Server: initiate a 1-1 call
  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallInitiateDto,
  ): Promise<void> {
    const callerId = this.ensureAuthed(client);
    if (!payload?.conversationId || !payload?.type) {
      client.emit('call:failed', { reason: 'invalid_payload' });
      return;
    }

    if (!this.checkRate(callerId, 'call:initiate')) {
      this.logger.debug(
        `Rate limit triggered for call:initiate (user=${callerId}) ttlMs=${this.wsCallRateTtlMs} limit=${this.wsCallRateLimit}`,
      );
      client.emit('rate:limit', { event: 'call:initiate', retryAfterMs: this.wsCallRateTtlMs });
      return;
    }

    try {
      const session = await this.calls.initiateCall({
        conversationId: payload.conversationId,
        callerId,
        type: payload.type as CallType,
      });
      this.incWs('call:initiate');

      // Notify callee
      this.server.to(this.userRoom(session.calleeId)).emit('call:incoming', {
        callId: session.callId,
        conversationId: session.conversationId,
        fromUserId: session.callerId,
        type: session.type,
        sdpOffer: payload.sdpOffer,
        createdAt: session.createdAt.toISOString(),
      });

      // Acknowledge caller
      client.emit('call:initiated', {
        callId: session.callId,
        conversationId: session.conversationId,
        calleeUserId: session.calleeId,
        type: session.type,
      });
    } catch (e) {
      const message = (e as Error).message;
      this.logger.debug(
        `Failed to initiate call for user=${callerId} conv=${payload?.conversationId}: ${message}`,
      );
      let reason: string = 'error';
      if (message === 'not a participant' || message === 'not_participant')
        reason = 'not_participant';
      else if (message === 'busy') reason = 'busy';
      else if (message === 'blocked') reason = 'blocked';
      client.emit('call:failed', { reason });
    }
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallAcceptDto,
  ): Promise<void> {
    const userId = this.ensureAuthed(client);
    if (!payload?.callId) {
      client.emit('call:failed', { reason: 'invalid_payload' });
      return;
    }

    try {
      const session = await this.calls.acceptCall(payload.callId, userId);
      this.incWs('call:accept');

      const data = {
        callId: session.callId,
        conversationId: session.conversationId,
        fromUserId: userId,
        sdpAnswer: payload.sdpAnswer,
      };
      this.server.to(this.userRoom(session.callerId)).emit('call:accepted', data);
      this.server.to(this.userRoom(session.calleeId)).emit('call:accepted', data);
    } catch (e) {
      const reasonMap: Record<string, string> = {
        call_not_found: 'call_not_found',
        invalid_state: 'invalid_state',
        not_callee: 'not_callee',
      };
      const reason = reasonMap[(e as Error).message] ?? 'error';
      client.emit('call:failed', { reason });
    }
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallRejectDto,
  ): Promise<void> {
    const userId = this.ensureAuthed(client);
    if (!payload?.callId) {
      client.emit('call:failed', { reason: 'invalid_payload' });
      return;
    }

    try {
      const session = await this.calls.rejectCall(payload.callId, userId, payload.reason);
      this.incWs('call:reject');

      const data = {
        callId: session.callId,
        conversationId: session.conversationId,
        fromUserId: userId,
        reason: session.endedReason ?? 'rejected',
      };
      this.server.to(this.userRoom(session.callerId)).emit('call:rejected', data);
      this.server.to(this.userRoom(session.calleeId)).emit('call:rejected', data);
    } catch (e) {
      const reasonMap: Record<string, string> = {
        call_not_found: 'call_not_found',
        invalid_state: 'invalid_state',
        not_participant: 'not_participant',
      };
      const reason = reasonMap[(e as Error).message] ?? 'error';
      client.emit('call:failed', { reason });
    }
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallEndDto,
  ): Promise<void> {
    const userId = this.ensureAuthed(client);
    if (!payload?.callId) {
      client.emit('call:failed', { reason: 'invalid_payload' });
      return;
    }

    try {
      const session = await this.calls.endCall(payload.callId, userId, payload.reason);
      this.incWs('call:end');

      const data = {
        callId: session.callId,
        conversationId: session.conversationId,
        fromUserId: userId,
        reason: session.endedReason ?? 'hangup',
      };
      this.server.to(this.userRoom(session.callerId)).emit('call:ended', data);
      this.server.to(this.userRoom(session.calleeId)).emit('call:ended', data);
    } catch (e) {
      const reasonMap: Record<string, string> = {
        call_not_found: 'call_not_found',
        not_participant: 'not_participant',
      };
      const reason = reasonMap[(e as Error).message] ?? 'error';
      client.emit('call:failed', { reason });
    }
  }

  @SubscribeMessage('call:ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIceCandidateDto,
  ): void {
    const userId = this.ensureAuthed(client);
    if (!payload?.callId || !payload?.candidate) {
      client.emit('call:failed', { reason: 'invalid_payload' });
      return;
    }

    this.incWs('call:ice_candidate');

    // For now, we don't track which peers belong to which call beyond the
    // session itself. The frontend is expected to know the remote party and
    // subscribe accordingly. We simply broadcast the candidate to both sides.
    const session = this.calls.getSession(payload.callId);
    if (!session) {
      client.emit('call:failed', { reason: 'call_not_found' });
      return;
    }

    const data = {
      callId: session.callId,
      conversationId: session.conversationId,
      fromUserId: userId,
      candidate: payload.candidate,
    };
    this.server.to(this.userRoom(session.callerId)).emit('call:ice_candidate', data);
    this.server.to(this.userRoom(session.calleeId)).emit('call:ice_candidate', data);
  }

  private ensureAuthed(client: Socket): string {
    const userId: string | undefined = client.data?.userId;
    if (!userId) {
      throw new UnauthorizedException('not authenticated');
    }
    return userId;
  }

  private userRoom(id: string): string {
    return `user:${id}`;
  }

  private checkRate(userId: string, event: string): boolean {
    const key = `${userId}:${event}`;
    const now = Date.now();
    const entry = this.rateCounters.get(key);
    if (!entry) {
      this.rateCounters.set(key, { windowStart: now, count: 1 });
      return true;
    }
    if (now - entry.windowStart > this.wsCallRateTtlMs) {
      entry.windowStart = now;
      entry.count = 1;
      return true;
    }
    if (entry.count >= this.wsCallRateLimit) {
      return false;
    }
    entry.count++;
    return true;
  }

  private incWs(event: string): void {
    try {
      wsEventsTotal.labels(event).inc(1);
    } catch {
      // ignore metrics errors
    }
  }
}
