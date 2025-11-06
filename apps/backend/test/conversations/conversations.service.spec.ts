import { ConversationsService } from '../../src/conversations/conversations.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { ConversationType, ParticipantRole } from '@prisma/client';

// removed unused uuid helper (was unused and had stray backtick)

describe('ConversationsService', () => {
  let service: ConversationsService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(() => {
    prisma = {
      conversation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      } as any,
      participant: {
        findMany: jest.fn(),
        create: jest.fn(),
      } as any,
    } as any;

    service = new ConversationsService(prisma as PrismaService);
  });

  it('returns existing private conversation idempotently', async () => {
    (prisma.conversation!.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'c1',
      type: ConversationType.private,
      groupName: null,
      groupAvatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [
        { userId: 'u1', role: ParticipantRole.member, joinedAt: new Date() },
        { userId: 'u2', role: ParticipantRole.member, joinedAt: new Date() },
      ],
    });
    const res = await service.create('u1', { type: 'private', participantUserIds: ['u2'] });
    expect(prisma.conversation!.findFirst).toHaveBeenCalledWith({
      where: {
        type: ConversationType.private,
        AND: [
          { participants: { some: { userId: 'u1' } } },
          { participants: { some: { userId: 'u2' } } },
        ],
      },
      include: { participants: true },
    });
    expect(res.id).toBe('c1');
  });

  it('creates group with admin role for creator', async () => {
    (prisma.conversation!.create as jest.Mock).mockResolvedValueOnce({
      id: 'c2',
      type: ConversationType.group,
      groupName: 'G',
      groupAvatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [
        { userId: 'u1', role: ParticipantRole.admin, joinedAt: new Date() },
        { userId: 'u3', role: ParticipantRole.member, joinedAt: new Date() },
      ],
    });
    const res = await service.create('u1', { type: 'group', groupName: 'G', participantUserIds: ['u3'] });
    expect(prisma.conversation!.create).toHaveBeenCalled();
    expect(res.participants.find((p) => p.userId === 'u1')!.role).toBe('admin');
  });

  it('update group requires admin', async () => {
    const now = new Date();
    (prisma.conversation!.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'c3',
      type: ConversationType.group,
      groupName: 'Old',
      groupAvatarUrl: null,
      createdAt: now,
      updatedAt: now,
      participants: [{ userId: 'u1', role: ParticipantRole.admin, joinedAt: now }],
    });
    (prisma.conversation!.update as jest.Mock).mockResolvedValueOnce({
      id: 'c3',
      type: ConversationType.group,
      groupName: 'New',
      groupAvatarUrl: null,
      createdAt: now,
      updatedAt: now,
      participants: [{ userId: 'u1', role: ParticipantRole.admin, joinedAt: now }],
    });
    const res = await service.update('c3', 'u1', { groupName: 'New' });
    expect(res.groupName).toBe('New');
  });
});
