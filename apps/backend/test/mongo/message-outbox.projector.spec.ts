import { Test } from '@nestjs/testing';
import { MessageOutboxProjector } from '../../src/mongo/message-outbox.projector.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import {
  MESSAGES_READ_MODEL_STORE,
  type MessagesReadModelStore,
} from '../../src/mongo/messages-read-model.store.js';

describe('MessageOutboxProjector', () => {
  let projector: MessageOutboxProjector;
  let prisma: {
    messageOutbox: {
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  } & Partial<PrismaService>;
  let store: MessagesReadModelStore & {
    upsertMessage: jest.Mock;
    markDeleted: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      messageOutbox: {
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    } as any;

    store = {
      upsertMessage: jest.fn(),
      markDeleted: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        MessageOutboxProjector,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MESSAGES_READ_MODEL_STORE,
          useValue: store,
        },
      ],
    }).compile();

    projector = moduleRef.get(MessageOutboxProjector);
  });

  it('returns 0/0 when no pending rows', async () => {
    prisma.messageOutbox.findMany.mockResolvedValueOnce([]);

    const result = await projector.processBatch(10);

    expect(result).toEqual({ processed: 0, failed: 0 });
    expect(store.upsertMessage).not.toHaveBeenCalled();
    expect(store.markDeleted).not.toHaveBeenCalled();
    expect(prisma.messageOutbox.update).not.toHaveBeenCalled();
  });

  it('short-circuits when limit is non-positive', async () => {
    const resultZero = await projector.processBatch(0);
    const resultNegative = await projector.processBatch(-5);

    expect(resultZero).toEqual({ processed: 0, failed: 0 });
    expect(resultNegative).toEqual({ processed: 0, failed: 0 });
    expect(prisma.messageOutbox.findMany).not.toHaveBeenCalled();
    expect(store.upsertMessage).not.toHaveBeenCalled();
    expect(store.markDeleted).not.toHaveBeenCalled();
  });

  it('processes message_created events and marks them processed', async () => {
    const row = {
      id: 'o1',
      eventType: 'message_created',
      status: 'pending',
      payload: {
        id: 'm1',
        conversationId: 'c1',
        senderId: 'u1',
        contentType: 'text',
        content: 'hello',
        mediaUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        deletedAt: null,
        replyToMessageId: null,
        eventVersion: 1,
        occurredAt: '2025-01-01T00:00:00.000Z',
      },
    } as any;

    prisma.messageOutbox.findMany.mockResolvedValueOnce([row]);
    prisma.messageOutbox.update.mockResolvedValue({});

    const result = await projector.processBatch(10);

    expect(result).toEqual({ processed: 1, failed: 0 });

    expect(store.upsertMessage).toHaveBeenCalledTimes(1);
    const doc = store.upsertMessage.mock.calls[0][0];
    expect(doc).toMatchObject({
      messageId: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      contentType: 'text',
      content: 'hello',
      mediaUrl: null,
      replyToMessageId: null,
    });

    expect(prisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: expect.objectContaining({ status: 'processed' }),
    });
  });

  it('processes message_deleted events and marks them processed', async () => {
    const row = {
      id: 'o2',
      eventType: 'message_deleted',
      status: 'pending',
      payload: {
        id: 'm2',
        conversationId: 'c1',
        senderId: 'u1',
        contentType: 'text',
        content: null,
        mediaUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        deletedAt: '2025-01-02T00:00:00.000Z',
        replyToMessageId: null,
        eventVersion: 1,
        occurredAt: '2025-01-02T00:00:00.000Z',
      },
    } as any;

    prisma.messageOutbox.findMany.mockResolvedValueOnce([row]);
    prisma.messageOutbox.update.mockResolvedValue({});

    const result = await projector.processBatch(10);

    expect(result).toEqual({ processed: 1, failed: 0 });

    expect(store.markDeleted).toHaveBeenCalledTimes(1);
    expect(store.markDeleted).toHaveBeenCalledWith('m2', expect.any(Date));

    expect(prisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 'o2' },
      data: expect.objectContaining({ status: 'processed' }),
    });
  });

  it('continues processing when one row fails and marks it failed', async () => {
    const goodRow = {
      id: 'o-good',
      eventType: 'message_created',
      status: 'pending',
      payload: {
        id: 'm-good',
        conversationId: 'c1',
        senderId: 'u1',
        contentType: 'text',
        content: 'hello',
        mediaUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        deletedAt: null,
        replyToMessageId: null,
        eventVersion: 1,
        occurredAt: '2025-01-01T00:00:00.000Z',
      },
    } as any;

    const badRow = {
      id: 'o-bad',
      eventType: 'message_created',
      status: 'pending',
      payload: null,
    } as any;

    prisma.messageOutbox.findMany.mockResolvedValueOnce([goodRow, badRow]);
    prisma.messageOutbox.update.mockResolvedValue({});

    const result = await projector.processBatch(10);

    expect(result).toEqual({ processed: 1, failed: 1 });

    expect(store.upsertMessage).toHaveBeenCalledTimes(1);

    expect(prisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 'o-good' },
      data: expect.objectContaining({ status: 'processed' }),
    });

    expect(prisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 'o-bad' },
      data: expect.objectContaining({ status: 'failed' }),
    });
  });

  it('marks unknown event types as processed without touching the read model', async () => {
    const row = {
      id: 'o-unknown',
      eventType: 'some_future_event',
      status: 'pending',
      payload: {
        id: 'm-unknown',
        conversationId: 'c1',
        senderId: 'u1',
        contentType: 'text',
        content: 'hello',
        mediaUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        deletedAt: null,
        replyToMessageId: null,
        eventVersion: 1,
        occurredAt: '2025-01-01T00:00:00.000Z',
      },
    } as any;

    prisma.messageOutbox.findMany.mockResolvedValueOnce([row]);
    prisma.messageOutbox.update.mockResolvedValue({});

    const result = await projector.processBatch(10);

    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(store.upsertMessage).not.toHaveBeenCalled();
    expect(store.markDeleted).not.toHaveBeenCalled();
    expect(prisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 'o-unknown' },
      data: expect.objectContaining({ status: 'processed' }),
    });
  });
});
