import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';

interface MessageStatusResponse {
  messageId: string;
  userId: string;
  status: string;
  readAt: Date | null;
}

interface MessageReadResponse {
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    contentType: string;
    content: string | null;
    mediaUrl: string | null;
    createdAt: Date;
  };
  status: MessageStatusResponse;
}

function mapMessage(m: any) {
  const { id, conversationId, senderId, contentType, content, mediaUrl, createdAt } = m;
  return { id, conversationId, senderId, contentType, content, mediaUrl, createdAt };
}

function mapStatus(s: any): MessageStatusResponse {
  const { messageId, userId, status, readAt } = s;
  return { messageId, userId, status, readAt };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesReadController {
  constructor(private readonly messages: MessagesService) {}

  @Post('messages/:messageId/read')
  async markRead(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Req() req: Request,
  ): Promise<MessageReadResponse> {
    const { userId } = req.user as any;
    const { message, status } = await this.messages.markRead(messageId, userId);
    return { message: mapMessage(message), status: mapStatus(status) };
  }

  @Get('messages/:messageId/status')
  async getStatuses(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Req() req: Request,
  ): Promise<MessageStatusResponse[]> {
    const { userId } = req.user as any;
    const statuses = await this.messages.getStatuses(messageId, userId);
    return statuses.map(mapStatus);
  }
}
