import { MessagesService } from '../../src/messages/messages.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { DeliveryStatus } from '@prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: jest.Mocked<Partial<PrismaService>>;
  let config: { get: jest.Mock };
  let messageOutbox: { enqueueMessageCreated: jest.Mock; enqueueMessageDeleted: jest.Mock };
  let timelineReadRepo: { listConversationMessages: jest.Mock };

  beforeEach(() => {
    config = {
      get: jest.fn().mockReturnValue(7 * 24 * 60 * 60),
    };

    prisma = {
      conversation: {
        findUnique: jest.fn(),
      } as any,
      participant: {
        findUnique: jest.fn(),
      } as any,
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as any,
      messageStatus: {
        createMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      } as any,
      media: {
        create: jest.fn(),
      } as any,
      $transaction: jest.fn(async (cb: (tx: any) => any) => cb(prisma)),
    } as any;

    messageOutbox = {
      enqueueMessageCreated: jest.fn(),
      enqueueMessageDeleted: jest.fn(),
    } as any;

    timelineReadRepo = {
      listConversationMessages: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    };

    service = new MessagesService(
      prisma as PrismaService,
      config as any,
      messageOutbox as any,
      timelineReadRepo as any,
    );
  });

  it('create sets read for sender and delivered for others', async () => {
    (prisma.conversation!.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c1',
      participants: [{ userId: 'u1' }, { userId: 'u2' }],
    });
    (prisma.message!.create as jest.Mock).mockResolvedValueOnce({
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      contentType: 'text',
      content: 'hello',
      mediaUrl: null,
      createdAt: new Date(),
    });
    const res = await service.create('c1', 'u1', { contentType: 'text', content: 'hello' } as any);
    expect(res.id).toBe('m1');
    expect(prisma.messageStatus!.createMany).toHaveBeenCalled();
    const callArg = (prisma.messageStatus!.createMany as jest.Mock).mock.calls[0][0];
    expect(callArg.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'u1', status: DeliveryStatus.read }),
        expect.objectContaining({ userId: 'u2', status: DeliveryStatus.delivered }),
      ]),
    );
    // No Media row should be created for pure text messages
    expect(prisma.media!.create).not.toHaveBeenCalled();
    // Outbox should be enqueued
    expect(messageOutbox.enqueueMessageCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1' }),
      prisma,
    );
  });

  it('creates a Media row when mediaUrl is provided for non-text message', async () => {
    (prisma.conversation!.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c2',
      participants: [{ userId: 'u1' }],
    });
    (prisma.message!.create as jest.Mock).mockResolvedValueOnce({
      id: 'm2',
      conversationId: 'c2',
      senderId: 'u1',
      contentType: 'image',
      content: null,
      mediaUrl: 'https://cdn.example.com/photo.png',
      createdAt: new Date(),
    });

    await service.create('c2', 'u1', {
      contentType: 'image',
      mediaUrl: 'https://cdn.example.com/photo.png',
      mediaMimeType: 'image/png',
      mediaSize: 1234,
      contentId: 'hash123',
    } as any);

    expect(messageOutbox.enqueueMessageCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm2' }),
      prisma,
    );

    expect(prisma.media!.create).toHaveBeenCalledWith({
      data: {
        uploaderId: 'u1',
        conversationId: 'c2',
        messageId: 'm2',
        url: 'https://cdn.example.com/photo.png',
        mimeType: 'image/png',
        size: 1234,
        contentId: 'hash123',
        storageProvider: 'r2',
        status: 'cloud_stored',
        expiresAt: expect.any(Date),
        lastAccessAt: null,
        objectKey: null,
      },
    });
  });

  it('list enforces participant', async () => {
    (prisma.participant!.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: 'u1',
      conversationId: 'c1',
    });

    const res = await service.list('c1', 'u1', 10);

    expect(timelineReadRepo.listConversationMessages).toHaveBeenCalledWith('c1', 10, undefined);
    expect(res).toEqual({ items: [], nextCursor: null });
  });

  it('markRead updates existing status', async () => {
    (prisma.message!.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm2',
      conversation: { participants: [{ userId: 'u1' }, { userId: 'u2' }] },
    });
    (prisma.messageStatus!.findUnique as jest.Mock).mockResolvedValueOnce({
      messageId: 'm2',
      userId: 'u2',
      status: DeliveryStatus.delivered,
      readAt: null,
    });
    (prisma.messageStatus!.update as jest.Mock).mockResolvedValueOnce({
      messageId: 'm2',
      userId: 'u2',
      status: DeliveryStatus.read,
      readAt: new Date(),
    });
    const res = await service.markRead('m2', 'u2');
    expect(res.status.status).toBe(DeliveryStatus.read);
    expect(prisma.messageStatus!.update).toHaveBeenCalled();
  });

  it('markRead is idempotent (second call no-op)', async () => {
    // First call transitions delivered -> read
    (prisma.message!.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'm4',
        conversation: { participants: [{ userId: 'u1' }, { userId: 'u2' }] },
      })
      .mockResolvedValueOnce({
        id: 'm4',
        conversation: { participants: [{ userId: 'u1' }, { userId: 'u2' }] },
      });
    (prisma.messageStatus!.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        messageId: 'm4',
        userId: 'u2',
        status: DeliveryStatus.delivered,
        readAt: null,
      })
      .mockResolvedValueOnce({
        messageId: 'm4',
        userId: 'u2',
        status: DeliveryStatus.read,
        readAt: new Date(),
      });
    (prisma.messageStatus!.update as jest.Mock).mockResolvedValueOnce({
      messageId: 'm4',
      userId: 'u2',
      status: DeliveryStatus.read,
      readAt: new Date(),
    });

    await service.markRead('m4', 'u2');
    await service.markRead('m4', 'u2');

    // update should be called only once across two calls
    expect(prisma.messageStatus!.update).toHaveBeenCalledTimes(1);
  });

  it('getStatuses returns statuses for participant', async () => {
    (prisma.message!.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'm3',
      conversation: { participants: [{ userId: 'u1' }] },
    });
    (prisma.messageStatus!.findMany as jest.Mock).mockResolvedValueOnce([
      { messageId: 'm3', userId: 'u1', status: DeliveryStatus.read, readAt: new Date() },
    ]);
    const res = await service.getStatuses('m3', 'u1');
    expect(res.length).toBe(1);
  });
});
