import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { messageSearchDurationSeconds, messageSearchRequestsTotal } from '../metrics/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface MessageSearchFilters {
  conversationId?: string;
  senderId?: string;
  from?: Date;
  to?: Date;
}

export interface MessageSearchItem {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  createdAt: Date;
}

export interface MessageSearchResult {
  message: MessageSearchItem;
  rank: number;
}

export interface MessageSearchPage {
  items: MessageSearchResult[];
  nextCursor?: string;
}

export abstract class MessageSearchRepository {
  abstract searchMessages(
    userId: string,
    query: string,
    filters: MessageSearchFilters,
    limit: number,
    cursor?: string,
  ): Promise<MessageSearchPage>;
}

interface CursorPayload {
  createdAt: string; // ISO
  id: string;
}

function encodeCursor(c: CursorPayload): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload;
  } catch {
    return null;
  }
}

type MessageSearchRow = {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  createdAt: Date;
  rank: number;
};

@Injectable()
export class PrismaMessageSearchRepository extends MessageSearchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async searchMessages(
    userId: string,
    query: string,
    filters: MessageSearchFilters,
    limit: number,
    cursor?: string,
  ): Promise<MessageSearchPage> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      try {
        messageSearchRequestsTotal.labels('empty_query').inc();
      } catch {
        // ignore metrics errors
      }
      return { items: [] };
    }

    const effectiveLimit = Math.min(Math.max(limit || 20, 1), 100);
    const cursorPayload = cursor ? decodeCursor(cursor) : null;

    const conditions: Prisma.Sql[] = [];

    // FTS match
    conditions.push(Prisma.sql`m."search_vector" @@ q`);

    // AuthZ: only conversations the user participates in
    conditions.push(
      Prisma.sql`m."conversationId" IN (
        SELECT "conversationId"
        FROM "Participant"
        WHERE "userId" = ${userId}
      )`,
    );

    if (filters.conversationId) {
      conditions.push(Prisma.sql`m."conversationId" = ${filters.conversationId}`);
    }

    if (filters.senderId) {
      conditions.push(Prisma.sql`m."senderId" = ${filters.senderId}`);
    }

    if (filters.from) {
      conditions.push(Prisma.sql`m."createdAt" >= ${filters.from}`);
    }

    if (filters.to) {
      conditions.push(Prisma.sql`m."createdAt" <= ${filters.to}`);
    }

    if (cursorPayload) {
      conditions.push(
        Prisma.sql`
          (
            m."createdAt" < ${new Date(cursorPayload.createdAt)}
            OR (m."createdAt" = ${new Date(cursorPayload.createdAt)} AND m."id" < ${cursorPayload.id})
          )
        `,
      );
    }

    const whereSql =
      conditions.length > 0
        ? Prisma.join(conditions, '\n  AND ')
        : Prisma.sql`TRUE`;

    const start = process.hrtime.bigint();
    let rows: MessageSearchRow[];

    try {
      rows = await this.prisma.$queryRaw<MessageSearchRow[]>`
        SELECT
          m."id",
          m."conversationId",
          m."senderId",
          m."contentType",
          m."content",
          m."createdAt",
          ts_rank(m."search_vector", q) AS "rank"
        FROM "Message" m,
             plainto_tsquery('simple', ${trimmedQuery}) AS q
        WHERE
          ${whereSql}
        ORDER BY
          "rank" DESC,
          m."createdAt" DESC,
          m."id" DESC
        LIMIT ${effectiveLimit + 1}
      `;

      try {
        const end = process.hrtime.bigint();
        const durationSec = Number(end - start) / 1e9;
        messageSearchDurationSeconds.labels('ok').observe(durationSec);
        messageSearchRequestsTotal.labels('ok').inc();
      } catch {
        // ignore metrics errors
      }
    } catch (err) {
      try {
        const end = process.hrtime.bigint();
        const durationSec = Number(end - start) / 1e9;
        messageSearchDurationSeconds.labels('error').observe(durationSec);
        messageSearchRequestsTotal.labels('error').inc();
      } catch {
        // ignore metrics errors
      }
      throw err;
    }

    const hasNext = rows.length > effectiveLimit;
    const slice = hasNext ? rows.slice(0, effectiveLimit) : rows;

    const items: MessageSearchResult[] = slice.map((row) => ({
      message: {
        id: row.id,
        conversationId: row.conversationId,
        senderId: row.senderId,
        contentType: row.contentType,
        content: row.content,
        createdAt: row.createdAt,
      },
      rank: row.rank,
    }));

    let nextCursor: string | undefined;
    if (hasNext) {
      const last = slice[slice.length - 1]!;
      nextCursor = encodeCursor({
        createdAt: last.createdAt.toISOString(),
        id: last.id,
      });
    }

    return { items, nextCursor };
  }
}
