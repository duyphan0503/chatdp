import {
  Body,
  Controller,
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
};

function mapMessage(m: MessageEntity): MessageResponse {
  const { id, conversationId, senderId, contentType, content, mediaUrl, createdAt } = m;
  return { id, conversationId, senderId, contentType, content, mediaUrl, createdAt };
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
    return mapMessage(msg);
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
    return { items: items.map(mapMessage), nextCursor };
  }
}
