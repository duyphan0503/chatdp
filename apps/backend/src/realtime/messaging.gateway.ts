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
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service.js';
import { PresenceRegistry } from './presence.registry.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface AccessPayload {
  sub: string; // userId
  email?: string;
  displayName?: string;
  typ?: string; // should be 'access'
}

@WebSocketGateway({ namespace: '/ws', cors: { origin: true, credentials: true } })
@Injectable()
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messages: MessagesService,
    private readonly presence: PresenceRegistry,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    // No-op until authenticate event
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data?.userId;
    if (userId) {
      const remaining = this.presence.remove(userId, client.id);
      this.logger.debug(`Socket disconnected: ${client.id}; user ${userId} sockets left=${remaining}`);
    }
  }

  // Client -> Server: send JWT to establish an authenticated session
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const secret = this.config.get<string>('JWT_SECRET') ?? 'change_me';
      const payload = await this.jwt.verifyAsync<AccessPayload>(data?.token, { secret });
      if (payload?.typ && payload.typ !== 'access') {
        throw new UnauthorizedException('invalid token type');
      }
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.join(this.userRoom(payload.sub));
      const count = this.presence.add(payload.sub, client.id);
      this.logger.debug(`Authenticated socket ${client.id} as user ${payload.sub}; online sockets=${count}`);
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
    @MessageBody() payload: { conversationId: string },
  ) {
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
    client.emit('conversation:joined', { conversationId: convId });
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    this.ensureAuthed(client);
    const convId = payload?.conversationId;
    if (!convId) return;
    await client.leave(this.conversationRoom(convId));
    client.emit('conversation:left', { conversationId: convId });
  }

  // Typing indicator
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean },
  ) {
    this.ensureAuthed(client);
    const userId: string = client.data.userId;
    const { conversationId, isTyping } = payload ?? {} as any;
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
    payload: {
      conversationId: string;
      contentType: 'text' | 'image' | 'video' | 'file' | 'voice';
      content?: string;
      mediaUrl?: string;
    },
  ) {
    this.ensureAuthed(client);
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
    @MessageBody() payload: { messageId: string },
  ) {
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

  private conversationRoom(id: string): string {
    return `conversation:${id}`;
  }

  private userRoom(id: string): string {
    return `user:${id}`;
  }
}
