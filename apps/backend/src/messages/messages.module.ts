import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { MessagesReadController } from './messages.read.controller.js';
import { MessagesSearchController } from './messages.search.controller.js';
import { PrismaMessageSearchRepository } from '../repositories/message-search.repository.js';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [MessagesController, MessagesReadController, MessagesSearchController],
  providers: [MessagesService, PrismaMessageSearchRepository],
  exports: [MessagesService, PrismaMessageSearchRepository],
})
export class MessagesModule {}
