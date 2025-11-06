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

// Repository-level representation of a message
export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: 'text' | 'image' | 'video' | 'file' | 'voice';
  content: string | null;
  mediaUrl: string | null;
  createdAt: Date;
}

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: CreateMessageInput): Promise<MessageRecord> {
    return (await this.prisma.message.create({
      data: {
        contentType: data.contentType,
        content: data.content ?? undefined,
        mediaUrl: data.mediaUrl ?? undefined,
        conversation: { connect: { id: data.conversationId } },
        sender: { connect: { id: data.senderId } },
      },
    })) as unknown as MessageRecord;
  }

  async listByConversation(opts: ListMessagesOptions): Promise<MessageRecord[]> {
    const take = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    if (opts.cursor) {
      return (await this.prisma.message.findMany({
        where: { conversationId: opts.conversationId },
        orderBy: { createdAt: 'desc' },
        take,
        skip: 1,
        cursor: { id: opts.cursor },
      })) as unknown as MessageRecord[];
    }
    return (await this.prisma.message.findMany({
      where: { conversationId: opts.conversationId },
      orderBy: { createdAt: 'desc' },
      take,
    })) as unknown as MessageRecord[];
  }
}
