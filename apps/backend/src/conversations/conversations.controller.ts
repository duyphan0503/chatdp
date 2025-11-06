import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ConversationsService } from './conversations.service.js';
import { ConversationCreateDto } from './dto/conversation-create.dto.js';
import { ConversationUpdateDto } from './dto/conversation-update.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  async create(@Body() dto: ConversationCreateDto, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.conversations.create(userId, dto);
  }

  @Get()
  async list(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.conversations.listForUser(userId);
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.conversations.findById(id, userId);
  }

  @Post(':id/join')
  async join(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.conversations.join(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ConversationUpdateDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.conversations.update(id, userId, dto);
  }
}
