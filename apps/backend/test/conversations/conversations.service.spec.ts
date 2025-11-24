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
        delete: jest.fn(),
        update: jest.fn(),
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
    const res = await service.create('u1', {
      type: 'group',
      groupName: 'G',
      participantUserIds: ['u3'],
    });
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

  it('addMember lets admin add a new member to group', async () => {
    const now = new Date();
    (prisma.conversation!.findUnique as jest.Mock)
      // first call: in addMember
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [{ userId: 'admin', role: ParticipantRole.admin, joinedAt: now }],
      })
      // second call: in findById
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [
          { userId: 'admin', role: ParticipantRole.admin, joinedAt: now },
          { userId: 'member', role: ParticipantRole.member, joinedAt: now },
        ],
      });

    (prisma.participant!.create as jest.Mock).mockResolvedValueOnce({
      userId: 'member',
      conversationId: 'cg',
      role: ParticipantRole.member,
      joinedAt: now,
    });

    const res = await service.addMember('cg', 'admin', 'member');
    expect(prisma.participant!.create).toHaveBeenCalledWith({
      data: { userId: 'member', conversationId: 'cg', role: ParticipantRole.member },
    });
    expect(res.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'admin', role: 'admin' }),
        expect.objectContaining({ userId: 'member', role: 'member' }),
      ]),
    );
  });

  it('removeMember lets admin remove member but not last admin', async () => {
    const now = new Date();
    // first call: in removeMember
    (prisma.conversation!.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [
          { userId: 'admin', role: ParticipantRole.admin, joinedAt: now },
          { userId: 'member', role: ParticipantRole.member, joinedAt: now },
        ],
      })
      // second call: findById after deletion
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [{ userId: 'admin', role: ParticipantRole.admin, joinedAt: now }],
      });

    (prisma.participant!.delete as jest.Mock).mockResolvedValueOnce({});

    const res = await service.removeMember('cg', 'admin', 'member');

    expect(prisma.participant!.delete).toHaveBeenCalledWith({
      where: { userId_conversationId: { userId: 'member', conversationId: 'cg' } },
    });
    expect(res.participants).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 'admin', role: 'admin' })]),
    );
  });

  it('setMemberRole promotes member to admin', async () => {
    const now = new Date();
    (prisma.conversation!.findUnique as jest.Mock)
      // first call: setMemberRole
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [
          { userId: 'admin', role: ParticipantRole.admin, joinedAt: now },
          { userId: 'member', role: ParticipantRole.member, joinedAt: now },
        ],
      })
      // second call: findById
      .mockResolvedValueOnce({
        id: 'cg',
        type: ConversationType.group,
        groupName: 'G',
        groupAvatarUrl: null,
        createdAt: now,
        updatedAt: now,
        participants: [
          { userId: 'admin', role: ParticipantRole.admin, joinedAt: now },
          { userId: 'member', role: ParticipantRole.admin, joinedAt: now },
        ],
      });

    (prisma.participant!.update as jest.Mock).mockResolvedValueOnce({
      userId: 'member',
      conversationId: 'cg',
      role: ParticipantRole.admin,
      joinedAt: now,
    });

    const res = await service.setMemberRole('cg', 'admin', 'member', 'admin');

    expect(prisma.participant!.update).toHaveBeenCalledWith({
      where: { userId_conversationId: { userId: 'member', conversationId: 'cg' } },
      data: { role: ParticipantRole.admin },
    });
    expect(res.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'admin', role: 'admin' }),
        expect.objectContaining({ userId: 'member', role: 'admin' }),
      ]),
    );
  });
});
