import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeliveryStatus } from '@prisma/client';
import { MessageCreateDto } from './dto/message-create.dto.js';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(conversationId: string, senderId: string, dto: MessageCreateDto) {
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

      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          contentType: dto.contentType as any,
          content: dto.content ?? null,
          mediaUrl: dto.mediaUrl ?? null,
        },
      });

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

  async list(conversationId: string, userId: string, limit = 20, cursor?: string): Promise<{ items: any[]; nextCursor: string | null }> {
    // Enforce participant
    const participant = await this.prisma.participant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
      select: { userId: true },
    });
    if (!participant) throw new ForbiddenException('not a participant');

    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const query: any = {
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1, // fetch one extra to compute nextCursor
    };
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // exclude the cursor itself
    }
    const rows = await this.prisma.message.findMany(query);
    const items = rows.slice(0, take);
    const nextCursor = rows.length > take ? items[items.length - 1]?.id ?? null : null;
    return { items, nextCursor };
  }

  async markRead(messageId: string, userId: string) {
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

    let statusRecord;
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

  async getStatuses(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!msg) throw new NotFoundException('message not found');
    const isParticipant = msg.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('not a participant');

    return this.prisma.messageStatus.findMany({ where: { messageId } });
  }
}
