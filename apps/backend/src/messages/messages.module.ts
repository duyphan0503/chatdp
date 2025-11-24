import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { MessagesReadController } from './messages.read.controller.js';

@Module({
  imports: [PrismaModule, PassportModule, ConfigModule],
  controllers: [MessagesController, MessagesReadController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
