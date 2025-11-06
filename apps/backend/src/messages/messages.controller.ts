import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MessageCreateDto } from './dto/message-create.dto.js';
import { MessageListDto } from './dto/message-list.dto.js';
import type { Request } from 'express';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  async create(
    @Param('conversationId', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Body() dto: MessageCreateDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.messages.create(conversationId, userId, dto);
  }

  @Get()
  async list(
    @Param('conversationId', new ParseUUIDPipe({ version: '4' })) conversationId: string,
    @Query() query: MessageListDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.messages.list(conversationId, userId, query.limit ?? 20, query.cursor); // returns { items, nextCursor }
  }
}
