import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MessageCreateDto } from './dto/message-create.dto.js';
import { MessageListDto } from './dto/message-list.dto.js';
import type { Request } from 'express';

interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: Date;
  replyToMessageId?: string | null;
  deletedAt?: Date | null;
}

interface MessageListMappedResponse {
  items: MessageResponse[];
  nextCursor: string | null;
}

type MessageEntity = {
  id: string;
  conversationId: string;
  senderId: string;
  contentType: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: Date;
  replyToMessageId?: string | null;
  deletedAt?: Date | null;
};

function mapMessage(m: MessageEntity): MessageResponse {
  const {
    id,
    conversationId,
    senderId,
    contentType,
    content,
    mediaUrl,
    createdAt,
    replyToMessageId,
    deletedAt,
  } = m;
  return {
    id,
    conversationId,
    senderId,
    contentType,
    content,
    mediaUrl,
    createdAt,
    replyToMessageId,
    deletedAt,
  };
}

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  async create(
    @Param('conversationId', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: MessageCreateDto,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    const { userId } = req.user as { userId: string };
    const msg = await this.messages.create(conversationId, userId, dto);
    return mapMessage(msg as MessageEntity);
  }

  @Get()
  async list(
    @Param('conversationId', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Query() query: MessageListDto,
    @Req() req: Request,
  ): Promise<MessageListMappedResponse> {
    const { userId } = req.user as { userId: string };
    const { items, nextCursor } = await this.messages.list(
      conversationId,
      userId,
      query.limit ?? 20,
      query.cursor,
    );
    return { items: items.map((m) => mapMessage(m as MessageEntity)), nextCursor };
  }

  @Post(':messageId/reactions')
  async addReaction(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Body('emoji') emoji: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as { userId: string };
    return this.messages.addReaction(messageId, userId, emoji);
  }

  @Delete(':messageId/reactions')
  async removeReaction(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Body('emoji') emoji: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as { userId: string };
    await this.messages.removeReaction(messageId, userId, emoji);
    return { status: 'ok' };
  }

  @Delete(':messageId')
  async softDelete(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    const { userId } = req.user as { userId: string };
    const msg = await this.messages.softDelete(messageId, userId);
    return mapMessage(msg as MessageEntity);
  }
}
