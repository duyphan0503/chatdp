import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { MessagesReadController } from './messages.read.controller.js';
import { MessagesSearchController } from './messages.search.controller.js';
import { PrismaMessageSearchRepository } from '../repositories/message-search.repository.js';
import { MessageOutboxRepository } from '../repositories/message-outbox.repository.js';
import {
  MESSAGES_TIMELINE_READ_REPOSITORY,
  MongoMessagesTimelineReadRepository,
  PostgresMessagesTimelineReadRepository,
} from '../repositories/messages-timeline-read.repository.js';
import {
  MESSAGES_READ_MODEL_STORE,
  NoopMessagesReadModelStore,
} from '../mongo/messages-read-model.store.js';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [MessagesController, MessagesReadController, MessagesSearchController],
  providers: [
    MessagesService,
    PrismaMessageSearchRepository,
    MessageOutboxRepository,
    PostgresMessagesTimelineReadRepository,
    MongoMessagesTimelineReadRepository,
    {
      provide: MESSAGES_TIMELINE_READ_REPOSITORY,
      inject: [
        MESSAGES_READ_MODEL_STORE,
        PostgresMessagesTimelineReadRepository,
        MongoMessagesTimelineReadRepository,
      ],
      useFactory: (
        store: unknown,
        pgRepo: PostgresMessagesTimelineReadRepository,
        mongoRepo: MongoMessagesTimelineReadRepository,
      ): PostgresMessagesTimelineReadRepository | MongoMessagesTimelineReadRepository => {
        if (store instanceof NoopMessagesReadModelStore) {
          return pgRepo;
        }
        return mongoRepo;
      },
    },
  ],
  exports: [MessagesService, PrismaMessageSearchRepository],
})
export class MessagesModule {}
