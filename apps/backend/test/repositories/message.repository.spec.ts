import { MessageRepository } from '../../src/repositories/message.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('MessageRepository', () => {
  let repo: MessageRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(() => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
      } as any,
    } as any;

    repo = new MessageRepository(prisma as PrismaService);
  });

  it('createMessage proxies to prisma.message.create with connect', async () => {
    await repo.createMessage({ contentType: 'text' as any, content: 'hello', conversationId: 'c1', senderId: 'u1' });
    expect(prisma.message!.create).toHaveBeenCalled();
  });

  it('listByConversation without cursor calls findMany with order and take', async () => {
    await repo.listByConversation({ conversationId: 'c1', limit: 10 });
    expect(prisma.message!.findMany).toHaveBeenCalledWith({ where: { conversationId: 'c1' }, orderBy: { createdAt: 'desc' }, take: 10 });
  });

  it('listByConversation with cursor uses cursor pagination', async () => {
    await repo.listByConversation({ conversationId: 'c1', limit: 10, cursor: 'm2' });
    expect(prisma.message!.findMany).toHaveBeenCalledWith({ where: { conversationId: 'c1' }, orderBy: { createdAt: 'desc' }, take: 10, skip: 1, cursor: { id: 'm2' } });
  });
});
