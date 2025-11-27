import { Injectable, Logger } from '@nestjs/common';
import type { Message, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type MessageOutboxEventType = 'message_created' | 'message_deleted';

export interface MessageOutboxPayload {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string; // ISO string
  deletedAt: string | null; // ISO string or null
  replyToMessageId: string | null;
  eventVersion: number;
  occurredAt: string; // ISO string
}

interface MessageOutboxDelegate {
  create(args: {
    data: {
      messageId: string;
      eventType: string;
      payload: MessageOutboxPayload;
    };
  }): Promise<unknown>;
}

type PrismaClientOrTx = (PrismaService | Prisma.TransactionClient) & {
  messageOutbox: MessageOutboxDelegate;
};

@Injectable()
export class MessageOutboxRepository {
  private readonly logger = new Logger(MessageOutboxRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async enqueueMessageCreated(message: Message, tx?: Prisma.TransactionClient): Promise<void> {
    await this.enqueue('message_created', message, tx);
  }

  async enqueueMessageDeleted(message: Message, tx?: Prisma.TransactionClient): Promise<void> {
    await this.enqueue('message_deleted', message, tx);
  }

  private async enqueue(
    eventType: MessageOutboxEventType,
    message: Message,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client: PrismaClientOrTx = (tx ?? this.prisma) as PrismaClientOrTx;
    const payload = this.buildPayload(message);

    try {
      await client.messageOutbox.create({
        data: {
          messageId: message.id,
          eventType,
          payload,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue message outbox event: type=${eventType} messageId=${message.id} error=${String(err)}`,
      );
    }
  }

  private buildPayload(message: Message): MessageOutboxPayload {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      contentType: message.contentType,
      content: message.content,
      mediaUrl: message.mediaUrl,
      createdAt: message.createdAt.toISOString(),
      deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
      replyToMessageId: message.replyToMessageId ?? null,
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
    };
  }
}
