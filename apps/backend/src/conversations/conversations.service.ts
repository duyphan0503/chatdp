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

  private mapConversationWithParticipants(conversation: {
    id: string;
    type: ConversationType;
    groupName: string | null;
    groupAvatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    participants: { userId: string; role: ParticipantRole; joinedAt: Date }[];
  }): ConversationWithParticipants {
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

  private async getGroupConversationAsAdmin(
    conversationId: string,
    actorUserId: string,
  ): Promise<{
    id: string;
    type: ConversationType;
    groupName: string | null;
    groupAvatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    participants: { userId: string; role: ParticipantRole; joinedAt: Date }[];
  }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('conversation not found');
    }

    if (conversation.type !== ConversationType.group) {
      throw new BadRequestException('not a group conversation');
    }

    const actor = conversation.participants.find((p) => p.userId === actorUserId);
    if (!actor) {
      throw new ForbiddenException('not a participant');
    }
    if (actor.role !== ParticipantRole.admin) {
      throw new ForbiddenException('not an admin');
    }

    return conversation;
  }

  async create(
    creatorUserId: string,
    dto: ConversationCreateDto,
  ): Promise<ConversationWithParticipants> {
    if (dto.type === 'private') {
      const participantIds = dto.participantUserIds ?? [];
      if (participantIds.length !== 1) {
        throw new BadRequestException(
          'private conversation must have exactly one other participant',
        );
      }

      const otherUserId = participantIds[0];
      if (otherUserId === creatorUserId) {
        throw new BadRequestException('cannot create private conversation with self');
      }

      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.private,
          AND: [
            { participants: { some: { userId: creatorUserId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
        include: { participants: true },
      });

      if (existing) {
        return this.mapConversationWithParticipants(existing);
      }

      const created = await this.prisma.conversation.create({
        data: {
          type: ConversationType.private,
          participants: {
            createMany: {
              data: [
                { userId: creatorUserId, role: ParticipantRole.member },
                { userId: otherUserId, role: ParticipantRole.member },
              ],
            },
          },
        },
        include: { participants: true },
      });

      return this.mapConversationWithParticipants(created);
    }

    const participantUserIds = dto.participantUserIds ?? [];

    const created = await this.prisma.conversation.create({
      data: {
        type: ConversationType.group,
        groupName: dto.groupName ?? null,
        groupAvatarUrl: dto.groupAvatarUrl ?? null,
        participants: {
          createMany: {
            data: [
              { userId: creatorUserId, role: ParticipantRole.admin },
              ...participantUserIds.map((userId) => ({
                userId,
                role: ParticipantRole.member,
              })),
            ],
          },
        },
      },
      include: { participants: true },
    });

    return this.mapConversationWithParticipants(created);
  }

  async findById(conversationId: string, userId: string): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('not a participant');
    }

    return this.mapConversationWithParticipants(conversation);
  }

  async listForUser(userId: string): Promise<ConversationWithParticipants[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: { participants: true },
    });

    return conversations.map((conversation) => this.mapConversationWithParticipants(conversation));
  }

  async join(conversationId: string, userId: string): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('conversation not found');
    }

    if (conversation.type !== ConversationType.group) {
      throw new BadRequestException('not a group conversation');
    }

    const existingParticipant = conversation.participants.some((p) => p.userId === userId);
    if (existingParticipant) {
      return this.mapConversationWithParticipants(conversation);
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          create: {
            userId,
            role: ParticipantRole.member,
          },
        },
      },
      include: { participants: true },
    });

    return this.mapConversationWithParticipants(updatedConversation);
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

    if (!conversation) {
      throw new NotFoundException('conversation not found');
    }

    if (conversation.type !== ConversationType.group) {
      throw new BadRequestException('not a group conversation');
    }

    const actor = conversation.participants.find((p) => p.userId === userId);
    if (!actor) {
      throw new ForbiddenException('not a participant');
    }
    if (actor.role !== ParticipantRole.admin) {
      throw new ForbiddenException('not an admin');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        groupName: dto.groupName ?? conversation.groupName,
        groupAvatarUrl: dto.groupAvatarUrl ?? conversation.groupAvatarUrl,
      },
      include: { participants: true },
    });

    return this.mapConversationWithParticipants(updated);
  }

  async addMember(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.getGroupConversationAsAdmin(conversationId, actorUserId);

    const existing = conversation.participants.find((p) => p.userId === targetUserId);
    if (existing) {
      return this.findById(conversationId, actorUserId);
    }

    await this.prisma.participant.create({
      data: {
        userId: targetUserId,
        conversationId,
        role: ParticipantRole.member,
      },
    });

    return this.findById(conversationId, actorUserId);
  }

  async removeMember(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.getGroupConversationAsAdmin(conversationId, actorUserId);

    const target = conversation.participants.find((p) => p.userId === targetUserId);

    if (!target) {
      throw new NotFoundException('member not found');
    }

    if (target.role === ParticipantRole.admin) {
      const admins = conversation.participants.filter((p) => p.role === ParticipantRole.admin);
      if (admins.length === 1) {
        throw new BadRequestException('cannot remove last admin');
      }
    }

    await this.prisma.participant.delete({
      where: { userId_conversationId: { userId: targetUserId, conversationId } },
    });

    return this.findById(conversationId, actorUserId);
  }

  async setMemberRole(
    conversationId: string,
    actorUserId: string,
    targetUserId: string,
    role: 'admin' | 'member',
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.getGroupConversationAsAdmin(conversationId, actorUserId);

    const target = conversation.participants.find((p) => p.userId === targetUserId);
    if (!target) {
      throw new NotFoundException('member not found');
    }

    if (target.role === ParticipantRole.admin && role === 'member') {
      const admins = conversation.participants.filter((p) => p.role === ParticipantRole.admin);
      if (admins.length === 1) {
        throw new BadRequestException('cannot demote last admin');
      }
    }

    if (target.role !== role) {
      await this.prisma.participant.update({
        where: { userId_conversationId: { userId: targetUserId, conversationId } },
        data: { role: role === 'admin' ? ParticipantRole.admin : ParticipantRole.member },
      });
    }

    return this.findById(conversationId, actorUserId);
  }
}
