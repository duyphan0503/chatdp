import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { messageOutboxItemsProcessedTotal, messageOutboxPending } from '../metrics/index.js';
import {
  type MessageOutboxEventType,
  type MessageOutboxPayload,
} from '../repositories/message-outbox.repository.js';

import {
  type MessagesReadModelDocument,
  type MessagesReadModelStore,
  MESSAGES_READ_MODEL_STORE,
} from './messages-read-model.store.js';

export interface ProcessBatchResult {
  processed: number;
  failed: number;
}

interface MessageOutboxRow {
  id: string;
  eventType: string;
  payload: unknown;
}

interface PrismaMessageOutboxDelegate {
  findMany(args: {
    where: { status: 'pending' };
    orderBy: Array<{ createdAt: 'asc' } | { id: 'asc' } | { createdAt: 'asc'; id: 'asc' }>;
    take: number;
  }): Promise<MessageOutboxRow[]>;
  update(args: {
    where: { id: string };
    data:
      | {
          status: 'processed';
          processedAt: Date;
          attempts: { increment: number };
          errorMessage: null;
        }
      | {
          status: 'failed';
          attempts: { increment: number };
          errorMessage: string;
        };
  }): Promise<unknown>;
  count(args: { where: { status: 'pending' } }): Promise<number>;
}

type PrismaWithOutbox = PrismaService & { messageOutbox: PrismaMessageOutboxDelegate };

@Injectable()
export class MessageOutboxProjector {
  private readonly logger = new Logger(MessageOutboxProjector.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MESSAGES_READ_MODEL_STORE)
    private readonly store: MessagesReadModelStore,
  ) {}

  private get prismaOutbox(): PrismaWithOutbox {
    return this.prisma as unknown as PrismaWithOutbox;
  }

  async processBatch(limit: number): Promise<ProcessBatchResult> {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
    if (safeLimit <= 0) {
      return { processed: 0, failed: 0 };
    }

    const rows = await this.prismaOutbox.messageOutbox.findMany({
      where: { status: 'pending' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: safeLimit,
    });

    if (!rows.length) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      // Process each row independently so that one failure does not abort the whole batch.
      // On failure we mark the row as failed in Postgres and continue.
      // We choose to set status = 'failed' to avoid retrying poison-pill events indefinitely.
      const ok = await this.processSingle(row);
      if (ok) {
        processed += 1;
        messageOutboxItemsProcessedTotal.labels('processed').inc();
      } else {
        failed += 1;
        messageOutboxItemsProcessedTotal.labels('failed').inc();
      }
    }

    // Update backlog gauge: how many pending items remain after this batch.
    try {
      const pending = await this.prismaOutbox.messageOutbox.count({
        where: { status: 'pending' },
      });
      messageOutboxPending.set(pending);
    } catch {
      // metrics should never break the projector; ignore errors here.
    }

    return { processed, failed };
  }

  private async processSingle(row: MessageOutboxRow): Promise<boolean> {
    const eventType = row.eventType as MessageOutboxEventType;
    const payload = row.payload as MessageOutboxPayload | null;

    if (!payload || typeof payload !== 'object') {
      const err = new Error('Invalid outbox payload');
      this.logger.error(
        `Failed to project outbox id=${row.id} type=${String(eventType)}: ${String(err)}`,
      );
      await this.markFailed(row.id, err);
      return false;
    }

    try {
      switch (eventType) {
        case 'message_created': {
          const doc = this.mapPayloadToDocument(payload);
          await this.store.upsertMessage(doc);
          break;
        }
        case 'message_deleted': {
          const deletedAt = payload.deletedAt ? new Date(payload.deletedAt) : new Date();
          await this.store.markDeleted(payload.id, deletedAt);
          break;
        }
        default: {
          this.logger.warn(
            `Unknown MessageOutbox eventType="${String(eventType)}" for id=${row.id}; marking as processed to avoid reprocessing loop`,
          );
        }
      }

      await this.markProcessed(row.id);
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to project outbox id=${row.id} type=${String(eventType)}: ${String(err)}`,
      );
      await this.markFailed(row.id, err);
      return false;
    }
  }

  private mapPayloadToDocument(payload: MessageOutboxPayload): MessagesReadModelDocument {
    const createdAt = new Date(payload.createdAt);
    const deletedAt = payload.deletedAt ? new Date(payload.deletedAt) : null;

    return {
      messageId: payload.id,
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      contentType: payload.contentType,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      createdAt,
      deletedAt,
      replyToMessageId: payload.replyToMessageId,
      sortKey: createdAt,
    };
  }

  private async markProcessed(id: string): Promise<void> {
    await this.prismaOutbox.messageOutbox.update({
      where: { id },
      data: {
        status: 'processed',
        processedAt: new Date(),
        attempts: { increment: 1 },
        errorMessage: null,
      },
    });
  }

  private async markFailed(id: string, err: unknown): Promise<void> {
    const message = this.truncateErrorMessage(err);

    await this.prismaOutbox.messageOutbox.update({
      where: { id },
      data: {
        status: 'failed',
        attempts: { increment: 1 },
        errorMessage: message,
      },
    });
  }

  private truncateErrorMessage(err: unknown, maxLength = 500): string {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.length <= maxLength) return raw;
    return raw.slice(0, maxLength);
  }
}
