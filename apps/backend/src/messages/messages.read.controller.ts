import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesReadController {
  constructor(private readonly messages: MessagesService) {}

  @Post('messages/:messageId/read')
  async markRead(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.messages.markRead(messageId, userId);
  }

  @Get('messages/:messageId/status')
  async getStatuses(
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.messages.getStatuses(messageId, userId);
  }
}
