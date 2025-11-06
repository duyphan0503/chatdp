import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { MessagesReadController } from './messages.read.controller.js';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [MessagesController, MessagesReadController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
