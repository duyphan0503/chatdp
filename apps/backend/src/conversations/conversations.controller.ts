import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConversationsService, ConversationWithParticipants } from './conversations.service.js';
import { ConversationCreateDto } from './dto/conversation-create.dto.js';
import { ConversationUpdateDto } from './dto/conversation-update.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';
// NOTE: Participants are intentionally omitted from API responses (Phase 4 decision)
// to keep the public schema minimal until group feature expansion phase.
// Internal service still returns participants for authorization logic; controller maps them out.
interface ConversationResponse {
  id: string;
  type: 'private' | 'group';
  groupName: string | null;
  groupAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapConversation(c: ConversationWithParticipants): ConversationResponse {
  const { id, type, groupName, groupAvatarUrl, createdAt, updatedAt } = c;
  return { id, type, groupName, groupAvatarUrl, createdAt, updatedAt };
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  async create(
    @Body() dto: ConversationCreateDto,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.create(userId, dto);
    return mapConversation(conv);
  }

  @Get()
  async list(@Req() req: Request): Promise<ConversationResponse[]> {
    const { userId } = req.user as { userId: string };
    const convs = await this.conversations.listForUser(userId);
    return convs.map(mapConversation);
  }

  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.findById(id, userId);
    return mapConversation(conv);
  }

  @Post(':id/join')
  async join(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.join(id, userId);
    return mapConversation(conv);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ConversationUpdateDto,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.update(id, userId, dto);
    return mapConversation(conv);
  }
}
