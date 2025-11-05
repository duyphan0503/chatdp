import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateConversationInput {
  type: 'private' | 'group';
  groupName?: string | null;
  groupAvatarUrl?: string | null;
}

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(data: CreateConversationInput): Promise<unknown> {
    return this.prisma.conversation.create({
      data: {
        type: data.type,
        groupName: data.groupName ?? undefined,
        groupAvatarUrl: data.groupAvatarUrl ?? undefined,
      },
    });
  }

  async addParticipant(
    userId: string,
    conversationId: string,
    role: 'admin' | 'member' = 'member',
  ): Promise<unknown> {
    return this.prisma.participant.create({
      data: {
        userId,
        conversationId,
        role,
      },
    });
  }

  async listByUser(userId: string): Promise<unknown[]> {
    return this.prisma.participant.findMany({
      where: { userId },
      include: { conversation: true },
    });
  }
}
