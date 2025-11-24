import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import {
  DeliveryStatus,
  ContentType,
  Prisma,
  Message,
  MessageStatus,
  Reaction,
} from '@prisma/client';
import type { Env } from '../config/env.schema.js';
import { MessageCreateDto } from './dto/message-create.dto.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(conversationId: string, senderId: string, dto: MessageCreateDto): Promise<Message> {
    // Ensure conversation exists and load participants to compute statuses inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { userId: true } } },
      });
      if (!conv) throw new NotFoundException('conversation not found');
      const isParticipant = conv.participants.some((p) => p.userId === senderId);
      if (!isParticipant) throw new ForbiddenException('not a participant');

      if (dto.contentType === 'text') {
        if (!dto.content) throw new BadRequestException('text message requires content');
      }

      if (dto.replyToMessageId) {
        const parent = await tx.message.findUnique({
          where: { id: dto.replyToMessageId },
          select: { conversationId: true },
        });
        if (!parent || parent.conversationId !== conversationId) {
          throw new BadRequestException(
            'replyToMessageId must refer to a message in this conversation',
          );
        }
      }

      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          contentType: dto.contentType as ContentType, // enum narrowed by DTO union
          content: dto.content ?? null,
          mediaUrl: dto.mediaUrl ?? null,
          replyToMessageId: dto.replyToMessageId ?? null,
        },
      });

      // When a mediaUrl is provided (non-text message), persist a Media row linked to this message
      if (dto.contentType !== 'text' && dto.mediaUrl) {
        const ttlSeconds = this.config.get('MEDIA_TTL_SECONDS', { infer: true });
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        await tx.media.create({
          data: {
            uploaderId: senderId,
            conversationId,
            messageId: message.id,
            url: dto.mediaUrl,
            mimeType: dto.mediaMimeType ?? null,
            size: dto.mediaSize ?? null,
            contentId: dto.contentId ?? null,
            storageProvider: 'r2',
            status: 'cloud_stored',
            expiresAt,
            lastAccessAt: null,
            objectKey: null,
          },
        });
      }

      const statuses = conv.participants.map((p) => ({
        messageId: message.id,
        userId: p.userId,
        status: p.userId === senderId ? DeliveryStatus.read : DeliveryStatus.delivered,
        readAt: p.userId === senderId ? new Date() : null,
      }));
      await tx.messageStatus.createMany({ data: statuses, skipDuplicates: true });

      return message;
    });
  }

  async list(
    conversationId: string,
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: Message[]; nextCursor: string | null }> {
    // Enforce participant
    const participant = await this.prisma.participant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
      select: { userId: true },
    });
    if (!participant) throw new ForbiddenException('not a participant');

    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const baseQuery: Prisma.MessageFindManyArgs = {
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    };
    const rows = await this.prisma.message.findMany(
      cursor ? { ...baseQuery, cursor: { id: cursor }, skip: 1 } : baseQuery,
    );
    const items = rows.slice(0, take);
    const nextCursor = rows.length > take ? (items[items.length - 1]?.id ?? null) : null;
    return { items, nextCursor };
  }

  async markRead(
    messageId: string,
    userId: string,
  ): Promise<{ message: Message; status: MessageStatus }> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');

    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    const existing = await this.prisma.messageStatus.findUnique({
      where: { messageId_userId: { messageId, userId } },
    });

    let statusRecord: MessageStatus;
    if (existing) {
      if (existing.status !== DeliveryStatus.read) {
        statusRecord = await this.prisma.messageStatus.update({
          where: { messageId_userId: { messageId, userId } },
          data: { status: DeliveryStatus.read, readAt: new Date() },
        });
      } else {
        statusRecord = existing;
      }
    } else {
      statusRecord = await this.prisma.messageStatus.create({
        data: { messageId, userId, status: DeliveryStatus.read, readAt: new Date() },
      });
    }

    return { message: msg, status: statusRecord };
  }

  async getStatuses(messageId: string, userId: string): Promise<MessageStatus[]> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');
    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    return this.prisma.messageStatus.findMany({ where: { messageId } });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');
    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    if (!emoji || emoji.length > 64) {
      throw new BadRequestException('invalid emoji');
    }

    return this.prisma.reaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      update: {},
      create: { messageId, userId, emoji },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');
    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    await this.prisma.reaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
  }

  async softDelete(messageId: string, userId: string): Promise<Message> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');

    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    if (msg.senderId !== userId) {
      throw new ForbiddenException('only sender can delete message');
    }

    if (msg.deletedAt) {
      return msg;
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });
  }
}
