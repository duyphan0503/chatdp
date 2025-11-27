import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { MessagesReadModelDocument } from '../mongo/messages-read-model.store.js';
import { MongoMessagesReadModelStore } from '../mongo/messages-read-model.store.js';
import { messageTimelineReadsTotal } from '../metrics/metrics.service.js';

export interface MessagesTimelineRecord {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: Date;
  replyToMessageId: string | null;
  deletedAt: Date | null;
}
export interface MessagesTimelineReadRepository {
  listConversationMessages(
    conversationId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: MessagesTimelineRecord[]; nextCursor: string | null }>;
}
export const MESSAGES_TIMELINE_READ_REPOSITORY = 'MESSAGES_TIMELINE_READ_REPOSITORY';

@Injectable()
export class PostgresMessagesTimelineReadRepository implements MessagesTimelineReadRepository {
  constructor(private readonly prisma: PrismaService) {}
  async listConversationMessages(
    conversationId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: MessagesTimelineRecord[]; nextCursor: string | null }> {
    const take = Math.min(Math.max(limit ?? 20, 1), 100);

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const sliced = rows.slice(0, take);
    const lastItem = sliced[sliced.length - 1];
    const nextCursor = rows.length > take && lastItem ? lastItem.id : null;

    messageTimelineReadsTotal.labels('postgres').inc();

    return { items: sliced, nextCursor };
  }
}
@Injectable()
export class MongoMessagesTimelineReadRepository implements MessagesTimelineReadRepository {
  constructor(private readonly store: MongoMessagesReadModelStore) {}
  async listConversationMessages(
    conversationId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: MessagesTimelineRecord[]; nextCursor: string | null }> {
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const docs: MessagesReadModelDocument[] = await this.store.listConversationMessages(
      conversationId,
      { limit: take + 1, cursor },
    );

    const slicedDocs = docs.slice(0, take);
    const items: MessagesTimelineRecord[] = slicedDocs.map((doc) => ({
      id: doc.messageId,
      conversationId: doc.conversationId,
      senderId: doc.senderId,
      contentType: doc.contentType,
      content: doc.content,
      mediaUrl: doc.mediaUrl,
      createdAt: doc.createdAt,
      replyToMessageId: doc.replyToMessageId,
      deletedAt: doc.deletedAt,
    }));

    const lastItem = items[items.length - 1];
    const nextCursor = docs.length > take && lastItem ? lastItem.id : null;

    messageTimelineReadsTotal.labels('mongo').inc();

    return { items, nextCursor };
  }
}
