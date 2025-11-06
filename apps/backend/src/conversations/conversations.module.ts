import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConversationsService } from './conversations.service.js';
import { ConversationsController } from './conversations.controller.js';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
