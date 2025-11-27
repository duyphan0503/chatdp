import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { PrismaMessageSearchRepository } from '../../src/repositories/message-search.repository.js';

jest.mock('../../src/metrics/index.js', () => ({
  messageSearchRequestsTotal: { labels: () => ({ inc: jest.fn() }) },
  messageSearchDurationSeconds: { labels: () => ({ observe: jest.fn() }) },
}));

describe('PrismaMessageSearchRepository', () => {
  let repo: PrismaMessageSearchRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, PrismaMessageSearchRepository],
    }).compile();

    repo = moduleRef.get(PrismaMessageSearchRepository);
    prisma = moduleRef.get(PrismaService);
  });

  it('returns empty result and does not hit DB for empty query', async () => {
    const spy = jest.spyOn(prisma, '$queryRaw');

    const result = await repo.searchMessages('user1', '   ', {}, 10);

    expect(result.items).toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('passes through to prisma.$queryRaw and paginates', async () => {
    const rows = Array.from({ length: 3 }).map((_, i) => ({
      id: `m${i}`,
      conversationId: 'c1',
      senderId: 'u1',
      contentType: 'text',
      content: `hello ${i}`,
      createdAt: new Date(Date.now() - i * 1000),
      rank: 0.5,
    }));

    const spy = jest
      .spyOn(prisma, '$queryRaw')
      .mockResolvedValue(rows as unknown as Prisma.PrismaPromise<unknown>);

    const page = await repo.searchMessages('user1', 'hello', {}, 2);

    expect(spy).toHaveBeenCalled();
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeDefined();
  });
});
