import { MessageOutboxRepository } from '../../src/repositories/message-outbox.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('MessageOutboxRepository', () => {
  let repo: MessageOutboxRepository;
  let prisma: { messageOutbox: { create: jest.Mock } } & Partial<PrismaService>;

  const baseMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    contentType: 'text',
    content: 'hello',
    mediaUrl: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    replyToMessageId: null,
    deletedAt: null,
  } as any;

  beforeEach(() => {
    prisma = {
      messageOutbox: {
        create: jest.fn(),
      },
    } as any;

    repo = new MessageOutboxRepository(prisma as unknown as PrismaService);
  });

  it('enqueueMessageCreated writes an outbox row with expected fields', async () => {
    await repo.enqueueMessageCreated(baseMessage);

    expect(prisma.messageOutbox!.create).toHaveBeenCalledTimes(1);
    const arg = (prisma.messageOutbox!.create as jest.Mock).mock.calls[0][0];

    expect(arg.data).toMatchObject({
      messageId: 'm1',
      eventType: 'message_created',
    });

    expect(arg.data.payload).toMatchObject({
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      contentType: 'text',
      content: 'hello',
      mediaUrl: null,
      createdAt: expect.any(String),
      deletedAt: null,
      replyToMessageId: null,
      eventVersion: 1,
      occurredAt: expect.any(String),
    });
  });

  it('swallows errors from prisma and does not throw', async () => {
    (prisma.messageOutbox!.create as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    await expect(repo.enqueueMessageCreated(baseMessage)).resolves.toBeUndefined();
  });
});
