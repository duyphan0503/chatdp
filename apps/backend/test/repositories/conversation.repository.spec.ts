import { ConversationRepository } from '../../src/repositories/conversation.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('ConversationRepository', () => {
  let repo: ConversationRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(() => {
    prisma = {
      conversation: {
        create: jest.fn(),
      } as any,
      participant: {
        create: jest.fn(),
        findMany: jest.fn(),
      } as any,
    } as any;

    repo = new ConversationRepository(prisma as PrismaService);
  });

  it('createConversation proxies to prisma.conversation.create', async () => {
    await repo.createConversation({ type: 'private' as any });
    expect(prisma.conversation!.create).toHaveBeenCalled();
  });

  it('addParticipant proxies to prisma.participant.create', async () => {
    await repo.addParticipant('u1', 'c1', 'member');
    expect(prisma.participant!.create).toHaveBeenCalledWith({ data: { userId: 'u1', conversationId: 'c1', role: 'member' as any } });
  });

  it('listByUser proxies to prisma.participant.findMany with include', async () => {
    await repo.listByUser('u1');
    expect(prisma.participant!.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, include: { conversation: true } });
  });
});
