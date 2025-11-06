import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationCreateDto } from './dto/conversation-create.dto.js';
import { ConversationUpdateDto } from './dto/conversation-update.dto.js';
import { ConversationType, ParticipantRole } from '@prisma/client';

export interface ConversationWithParticipants {
  id: string;
  type: 'private' | 'group';
  groupName: string | null;
  groupAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: { userId: string; role: 'admin' | 'member'; joinedAt: Date }[];
}

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: ConversationCreateDto): Promise<ConversationWithParticipants> {
    if (dto.type === 'private') {
      if (!dto.participantUserIds || dto.participantUserIds.length !== 1) {
        throw new BadRequestException('private conversation requires exactly one other user');
      }
      const otherUserId = dto.participantUserIds[0];
      if (otherUserId === userId)
        throw new BadRequestException('cannot create private conversation with self');
      // Idempotent: check existing private conversation between the two users
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.private,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
        include: { participants: true },
      });
      if (existing) {
        return {
          id: existing.id,
          type: existing.type as 'private' | 'group',
          groupName: existing.groupName,
          groupAvatarUrl: existing.groupAvatarUrl,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
          participants: existing.participants.map((p) => ({
            userId: p.userId,
            role: p.role as 'admin' | 'member',
            joinedAt: p.joinedAt,
          })),
        };
      }
    }

    const dataParticipants =
      dto.type === 'group'
        ? [
            { userId, role: ParticipantRole.admin },
            ...(dto.participantUserIds?.map((pid) => ({
              userId: pid,
              role: ParticipantRole.member,
            })) ?? []),
          ]
        : // private
          [
            { userId, role: ParticipantRole.member },
            ...(dto.participantUserIds?.map((pid) => ({
              userId: pid,
              role: ParticipantRole.member,
            })) ?? []),
          ];

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type as ConversationType,
        groupName: dto.type === 'group' ? (dto.groupName ?? undefined) : undefined,
        groupAvatarUrl: dto.type === 'group' ? (dto.groupAvatarUrl ?? undefined) : undefined,
        participants: {
          create: dataParticipants,
        },
      },
      include: { participants: true },
    });

    return {
      id: conversation.id,
      type: conversation.type as 'private' | 'group',
      groupName: conversation.groupName,
      groupAvatarUrl: conversation.groupAvatarUrl,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((p) => ({
        userId: p.userId,
        role: p.role as 'admin' | 'member',
        joinedAt: p.joinedAt,
      })),
    };
  }

  async findById(conversationId: string, userId: string): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('conversation not found');
    const participant = conversation.participants.find((p) => p.userId === userId);
    if (!participant) throw new ForbiddenException('not a participant');
    return {
      id: conversation.id,
      type: conversation.type as 'private' | 'group',
      groupName: conversation.groupName,
      groupAvatarUrl: conversation.groupAvatarUrl,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants.map((p) => ({
        userId: p.userId,
        role: p.role as 'admin' | 'member',
        joinedAt: p.joinedAt,
      })),
    };
  }

  async listForUser(userId: string): Promise<ConversationWithParticipants[]> {
    const participants = await this.prisma.participant.findMany({
      where: { userId },
      include: { conversation: { include: { participants: true } } },
    });
    return participants.map((pr) => {
      const c = pr.conversation;
      return {
        id: c.id,
        type: c.type as 'private' | 'group',
        groupName: c.groupName,
        groupAvatarUrl: c.groupAvatarUrl,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        participants: c.participants.map((p) => ({
          userId: p.userId,
          role: p.role as 'admin' | 'member',
          joinedAt: p.joinedAt,
        })),
      };
    });
  }

  async join(conversationId: string, userId: string): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('conversation not found');
    const already = conversation.participants.find((p) => p.userId === userId);
    if (already) return this.findById(conversationId, userId);
    if (conversation.type !== ConversationType.group)
      throw new BadRequestException('cannot join non-group conversation');
    await this.prisma.participant.create({
      data: { userId, conversationId, role: ParticipantRole.member },
    });
    return this.findById(conversationId, userId);
  }

  async update(
    conversationId: string,
    userId: string,
    dto: ConversationUpdateDto,
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('conversation not found');
    if (conversation.type !== ConversationType.group)
      throw new BadRequestException('not a group conversation');
    const me = conversation.participants.find((p) => p.userId === userId);
    if (!me) throw new ForbiddenException('not a participant');
    if (me.role !== ParticipantRole.admin) throw new ForbiddenException('not an admin');
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        groupName: dto.groupName ?? conversation.groupName ?? undefined,
        groupAvatarUrl: dto.groupAvatarUrl ?? conversation.groupAvatarUrl ?? undefined,
      },
      include: { participants: true },
    });
    return {
      id: updated.id,
      type: updated.type as 'private' | 'group',
      groupName: updated.groupName,
      groupAvatarUrl: updated.groupAvatarUrl,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      participants: updated.participants.map((p) => ({
        userId: p.userId,
        role: p.role as 'admin' | 'member',
        joinedAt: p.joinedAt,
      })),
    };
  }
}
