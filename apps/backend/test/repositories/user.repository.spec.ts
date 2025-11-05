import { UserRepository } from '../../src/repositories/user.repository.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('UserRepository', () => {
  let repo: UserRepository;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as any,
    } as any;

    repo = new UserRepository(prisma as PrismaService);
  });

  it('findById calls prisma.user.findUnique with id', async () => {
    await repo.findById('u1');
    expect(prisma.user!.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('findByEmail calls prisma.user.findUnique with email', async () => {
    await repo.findByEmail('a@b.c');
    expect(prisma.user!.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.c' } });
  });

  it('updateDisplayName updates displayName', async () => {
    await repo.updateDisplayName('u1', 'New Name');
    expect(prisma.user!.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { displayName: 'New Name' } });
  });
});
