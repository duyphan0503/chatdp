import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateMessageInput {
  contentType: 'text' | 'image' | 'video' | 'file' | 'voice';
  content?: string | null;
  mediaUrl?: string | null;
  conversationId: string;
  senderId: string;
}

export interface ListMessagesOptions {
  conversationId: string;
  limit?: number;
  cursor?: string; // for seek-based pagination by id
}

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: CreateMessageInput): Promise<unknown> {
    return this.prisma.message.create({
      data: {
        contentType: data.contentType,
        content: data.content ?? undefined,
        mediaUrl: data.mediaUrl ?? undefined,
        conversation: { connect: { id: data.conversationId } },
        sender: { connect: { id: data.senderId } },
      },
    });
  }

  async listByConversation(opts: ListMessagesOptions): Promise<unknown[]> {
    const take = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    if (opts.cursor) {
      return this.prisma.message.findMany({
        where: { conversationId: opts.conversationId },
        orderBy: { createdAt: 'desc' },
        take,
        skip: 1,
        cursor: { id: opts.cursor },
      });
    }
    return this.prisma.message.findMany({
      where: { conversationId: opts.conversationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
