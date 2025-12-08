import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MessageSearchDto } from './dto/message-search.dto.js';
import { PrismaMessageSearchRepository } from '../repositories/message-search.repository.js';

interface MessageSearchResponseItem {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  createdAt: Date;
  rank: number;
}

interface MessageSearchResponse {
  items: MessageSearchResponseItem[];
  nextCursor?: string;
}

/**
 * Search HTTP endpoints for messages, with full-text and filter support.
 */
@UseGuards(JwtAuthGuard)
@Controller('search')
export class MessagesSearchController {
  constructor(private readonly searchRepo: PrismaMessageSearchRepository) {}

  /**
   * Performs a paginated search over messages visible to the authenticated
   * user, using optional conversation, sender and time-range filters.
   */
  @Get('messages')
  async searchMessages(
    @Query() query: MessageSearchDto,
    @Req() req: Request,
  ): Promise<MessageSearchResponse> {
    const { userId } = req.user as { userId: string };

    const filters = {
      conversationId: query.conversationId,
      senderId: query.senderId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };

    const limit = query.limit ?? 20;

    const page = await this.searchRepo.searchMessages(
      userId,
      query.q,
      filters,
      limit,
      query.cursor,
    );

    return {
      items: page.items.map(({ message, rank }) => ({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        contentType: message.contentType,
        content: message.content,
        createdAt: message.createdAt,
        rank,
      })),
      nextCursor: page.nextCursor,
    };
  }
}
