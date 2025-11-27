import {
  PostgresMessagesTimelineReadRepository,
  MongoMessagesTimelineReadRepository,
} from '../../src/repositories/messages-timeline-read.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import {
  type MessagesReadModelDocument,
  type MessagesReadModelStore,
  NoopMessagesReadModelStore,
  MongoMessagesReadModelStore,
} from '../../src/mongo/messages-read-model.store.js';

describe('MessagesTimelineReadRepository', () => {
  describe('PostgresMessagesTimelineReadRepository', () => {
    it('uses cursor pagination with createdAt desc', async () => {
      const prisma = {
        message: {
          findMany: jest.fn().mockResolvedValueOnce([{ id: 'm1' }, { id: 'm2' }]),
        },
      } as any as PrismaService;

      const repo = new PostgresMessagesTimelineReadRepository(prisma);

      const result = await repo.listConversationMessages('c1', 1, 'cursor-id');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'c1' },
        orderBy: { createdAt: 'desc' },
        take: 2,
        cursor: { id: 'cursor-id' },
        skip: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('m1');
    });
  });

  describe('MongoMessagesTimelineReadRepository', () => {
    it('maps documents to records and computes nextCursor', async () => {
      const docs: MessagesReadModelDocument[] = [
        {
          _id: undefined as any,
          messageId: 'm10',
          conversationId: 'c1',
          senderId: 'u1',
          contentType: 'text',
          content: 'hello',
          mediaUrl: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          deletedAt: null,
          replyToMessageId: null,
          sortKey: new Date('2024-01-01T10:00:00Z'),
        },
        {
          _id: undefined as any,
          messageId: 'm9',
          conversationId: 'c1',
          senderId: 'u2',
          contentType: 'text',
          content: 'world',
          mediaUrl: null,
          createdAt: new Date('2024-01-01T09:59:00Z'),
          deletedAt: null,
          replyToMessageId: null,
          sortKey: new Date('2024-01-01T09:59:00Z'),
        },
      ];

      const store: jest.Mocked<MessagesReadModelStore> = {
        upsertMessage: jest.fn(),
        markDeleted: jest.fn(),
        listConversationMessages: jest.fn().mockResolvedValueOnce(docs),
      } as any;

      const repo = new MongoMessagesTimelineReadRepository(store as any);

      const result = await repo.listConversationMessages('c1', 1);

      expect(store.listConversationMessages).toHaveBeenCalledWith('c1', {
        limit: 2,
        cursor: undefined,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ id: 'm10', content: 'hello' });
      expect(result.nextCursor).toBe('m10');
    });
  });

  describe('MessagesModule timeline repo selection (factory equivalent)', () => {
    class DummyMongoStore extends MongoMessagesReadModelStore {
      constructor() {
        // @ts-expect-error - we do not need a real MongoDB collection in tests.
        super({});
      }
    }

    it('uses Postgres repository when store is NoopMessagesReadModelStore', () => {
      const store = new NoopMessagesReadModelStore();
      const prisma = { message: { findMany: jest.fn() } } as any as PrismaService;
      const pgRepo = new PostgresMessagesTimelineReadRepository(prisma);
      const mongoRepo = new MongoMessagesTimelineReadRepository({
        // minimal stub, will not be called in this test
        listConversationMessages: jest.fn(),
        upsertMessage: jest.fn(),
        markDeleted: jest.fn(),
      } as any);

      const selected = (():
        | PostgresMessagesTimelineReadRepository
        | MongoMessagesTimelineReadRepository => {
        if (store instanceof NoopMessagesReadModelStore) {
          return pgRepo;
        }
        return mongoRepo;
      })();

      expect(selected).toBe(pgRepo);
    });

    it('uses Mongo repository when store is a MongoMessagesReadModelStore', () => {
      const store = new DummyMongoStore();
      const prisma = { message: { findMany: jest.fn() } } as any as PrismaService;
      const pgRepo = new PostgresMessagesTimelineReadRepository(prisma);
      const mongoRepo = new MongoMessagesTimelineReadRepository({
        // minimal stub, will not be called in this test
        listConversationMessages: jest.fn(),
        upsertMessage: jest.fn(),
        markDeleted: jest.fn(),
      } as any);

      const selected = (():
        | PostgresMessagesTimelineReadRepository
        | MongoMessagesTimelineReadRepository => {
        if (store instanceof NoopMessagesReadModelStore) {
          return pgRepo;
        }
        return mongoRepo;
      })();

      expect(selected).toBe(mongoRepo);
    });
  });
});
