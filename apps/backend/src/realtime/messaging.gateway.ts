import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service.js';
import { PresenceRegistry } from './presence.registry.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticateDto } from './dto/authenticate.dto.js';
import { ConversationJoinDto } from './dto/conversation-join.dto.js';
import { ConversationLeaveDto } from './dto/conversation-leave.dto.js';
import { TypingDto } from './dto/typing.dto.js';
import { MessageNewDto } from './dto/message-new.dto.js';
import { MessageReadDto } from './dto/message-read.dto.js';
import { wsEventsTotal } from '../metrics/metrics.service.js';

interface AccessPayload {
  sub: string; // userId
  email?: string;
  displayName?: string;
  typ?: string; // should be 'access'
}

@WebSocketGateway({ namespace: '/ws', cors: { origin: true, credentials: true } })
@Injectable()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagingGateway.name);
  private readonly wsRateTtlMs: number;
  private readonly wsRateLimit: number;
  private readonly rateCounters = new Map<string, { windowStart: number; count: number }>();

  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messages: MessagesService,
    private readonly presence: PresenceRegistry,
    private readonly prisma: PrismaService,
  ) {
    // Initialize WS rate limiting deterministically (numeric seconds + count)
    const ttlSecRaw = this.config.get<number>('WS_RATE_LIMIT_TTL', { infer: true });
    const limitRaw = this.config.get<number>('WS_RATE_LIMIT_LIMIT', { infer: true });
    const ttlSec = ttlSecRaw > 0 ? ttlSecRaw : 60;
    const limit = limitRaw > 0 ? limitRaw : 120;
    this.wsRateTtlMs = ttlSec * 1000;
    this.wsRateLimit = limit;

  }

  afterInit(server: Server): void {
    this.server = server;
  }

  handleConnection(client: Socket): void {
    // No-op until authenticate event
    this.logger.debug(`Socket connected: ${client.id}`);
    this.incWs('connection');
  }

  handleDisconnect(client: Socket): void {
    const userId: string | undefined = client.data?.userId;
    if (!userId) return;
    const remaining = this.presence.remove(userId, client.id);
    this.logger.debug(`Socket disconnected: ${client.id}; user ${userId} sockets left=${remaining}`);
    this.incWs('disconnect');
    if (remaining === 0) {
      // User fully offline; broadcast to all conversations they were part of
      const { conversations } = this.presence.clearUser(userId);
      for (const convId of conversations) {
        const room = this.conversationRoom(convId);
        this.server.to(room).emit('presence:offline', { userId });
        this.server.to(room).emit('conversation:user_left', { conversationId: convId, userId });
      }
    }
  }

  // Client -> Server: send JWT to establish an authenticated session
  @SubscribeMessage('authenticate')
  // metrics: authentication attempt
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AuthenticateDto,
  ): Promise<void> {
    try {
      const secret = this.config.get<string>('JWT_SECRET');
      if (!secret) {
        this.logger.error('JWT_SECRET is missing. Refusing authentication (fail-fast).');
        client.emit('unauthorized', { error: 'server_misconfigured' });
        client.disconnect(true);
        return;
      }
      this.incWs('authenticate');
      const payload = await this.jwt.verifyAsync<AccessPayload>(data?.token, { secret });
      if (payload?.typ && payload.typ !== 'access') {
        this.logger.warn(`Authentication failed (invalid token type) for socket ${client.id}`);
        client.emit('unauthorized', { error: 'invalid token' });
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.join(this.userRoom(payload.sub));
      const count = this.presence.add(payload.sub, client.id);
      this.logger.debug(`Authenticated socket ${client.id} as user ${payload.sub}; online sockets=${count}`);
      // On first online socket, emit presence:online to any rooms user has already joined (if any tracked)
      if (count === 1) {
        const joined = this.presence.getJoinedConversations(payload.sub);
        for (const convId of joined) {
          this.server.to(this.conversationRoom(convId)).emit('presence:online', { userId: payload.sub });
        }
      }
      client.emit('authenticated', { status: 'ok', userId: payload.sub });
    } catch (e) {
      this.logger.warn(`Authentication failed for socket ${client.id}: ${(e as Error).message}`);
      client.emit('unauthorized', { error: 'invalid token' });
      client.disconnect(true);
    }
  }

  // Join/leave conversation rooms
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationJoinDto,
  ): Promise<void> {
    this.ensureAuthed(client);
    const userId: string = client.data.userId;
    const convId = payload?.conversationId;
    if (!convId) return;
    const participant = await this.prisma.participant.findUnique({
      where: { userId_conversationId: { userId, conversationId: convId } },
      select: { userId: true },
    });
    if (!participant) {
      client.emit('error', { message: 'not a participant' });
      return;
    }
    await client.join(this.conversationRoom(convId));
    this.presence.joinConversation(userId, convId);
    // notify others in the room
    this.server.to(this.conversationRoom(convId)).emit('conversation:user_joined', { conversationId: convId, userId });
    // if this is the first socket for the user, let others know user is online
    if (this.presence.getUserSocketIds(userId).length === 1) {
      this.server.to(this.conversationRoom(convId)).emit('presence:online', { userId });
    }
    client.emit('conversation:joined', { conversationId: convId });
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationLeaveDto,
  ): Promise<void> {
    this.ensureAuthed(client);
    const convId = payload?.conversationId;
    if (!convId) return;
    await client.leave(this.conversationRoom(convId));
    this.presence.leaveConversation(client.data.userId, convId);
    this.server.to(this.conversationRoom(convId)).emit('conversation:user_left', { conversationId: convId, userId: client.data.userId });
    client.emit('conversation:left', { conversationId: convId });
  }

  // Typing indicator
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingDto,
  ): Promise<void> {
    this.ensureAuthed(client);
    if (!this.checkRate(client, 'typing')) {
      this.logger.debug(`Rate limit triggered for typing (user=${client.data.userId}) ttlMs=${this.wsRateTtlMs} limit=${this.wsRateLimit}`);
      client.emit('rate:limit', { event: 'typing', retryAfterMs: this.wsRateTtlMs });
      return;
    }
    const userId: string = client.data.userId;
    const { conversationId, isTyping } = (payload ?? {}) as any;
    if (!conversationId) return;
    this.server
      .to(this.conversationRoom(conversationId))
      .except(client.id)
      .emit('typing', { conversationId, userId, isTyping: isTyping });
  }

  // Create new message and broadcast
  @SubscribeMessage('message:new')
  async handleMessageNew(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: MessageNewDto,
  ): Promise<void> {
    this.ensureAuthed(client);
    if (!this.checkRate(client, 'message:new')) {
      this.logger.debug(`Rate limit triggered for message:new (user=${client.data.userId}) ttlMs=${this.wsRateTtlMs} limit=${this.wsRateLimit}`);
      client.emit('rate:limit', { event: 'message:new', retryAfterMs: this.wsRateTtlMs });
      return;
    }
    const userId: string = client.data.userId;
    const { conversationId, contentType, content, mediaUrl } = payload ?? ({} as any);
    if (!conversationId || !contentType) return;

    try {
      const message = await this.messages.create(conversationId, userId, {
        contentType,
        content,
        mediaUrl,
      });
      this.server
        .to(this.conversationRoom(conversationId))
        .emit('message:new', { message });
    } catch (e) {
      client.emit('error', { message: (e as Error).message ?? 'failed to send message' });
    }
  }

  // Mark message read and broadcast
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageReadDto,
  ): Promise<void> {
    this.ensureAuthed(client);
    const userId: string = client.data.userId;
    const { messageId } = payload ?? ({} as any);
    if (!messageId) return;
    try {
      const { message } = await this.messages.markRead(messageId, userId);
      this.server
        .to(this.conversationRoom(message.conversationId))
        .emit('message:read', { messageId: message.id, userId });
    } catch (e) {
      client.emit('error', { message: (e as Error).message ?? 'failed to mark read' });
    }
  }

  private ensureAuthed(client: Socket): void {
    if (!client.data?.userId) {
      throw new UnauthorizedException('not authenticated');
    }
  }

  private checkRate(client: Socket, event: string): boolean {
    const userId: string | undefined = client.data.userId;
    // Fallback to client id if unauthenticated (will be rejected later anyway)
    const key = `${userId ?? 'anon'}:${event}`;
    const now = Date.now();
    const entry = this.rateCounters.get(key);
    if (!entry) {
      this.rateCounters.set(key, { windowStart: now, count: 1 });
      return true;
    }
    if (now - entry.windowStart > this.wsRateTtlMs) {
      // Reset window
      entry.windowStart = now;
      entry.count = 1;
      return true;
    }
    if (entry.count >= this.wsRateLimit) {
      return false;
    }
    entry.count++;
    return true;
  }

  private conversationRoom(id: string): string {
    return `conversation:${id}`;
  }

  private userRoom(id: string): string {
    return `user:${id}`;
  }

  // Metrics hook for WebSocket events
  private incWs(event: string): void {
    try {
      wsEventsTotal.inc({ event } as any, 1);
    } catch {
      // ignore metrics errors
    }
  }
}
