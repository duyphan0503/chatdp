import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateConversationInput {
  type: 'private' | 'group';
  groupName?: string | null;
  groupAvatarUrl?: string | null;
}

// Repository-level records
export interface ConversationRecord {
  id: string;
  type: 'private' | 'group';
  groupName: string | null;
  groupAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantRecord {
  userId: string;
  conversationId: string;
  joinedAt: Date;
  role: 'admin' | 'member';
}

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(data: CreateConversationInput): Promise<ConversationRecord> {
    return (await this.prisma.conversation.create({
      data: {
        type: data.type,
        groupName: data.groupName ?? undefined,
        groupAvatarUrl: data.groupAvatarUrl ?? undefined,
      },
    })) as unknown as ConversationRecord;
  }

  async addParticipant(
    userId: string,
    conversationId: string,
    role: 'admin' | 'member' = 'member',
  ): Promise<ParticipantRecord> {
    return (await this.prisma.participant.create({
      data: {
        userId,
        conversationId,
        role,
      },
    })) as unknown as ParticipantRecord;
  }

  async listByUser(
    userId: string,
  ): Promise<(ParticipantRecord & { conversation: ConversationRecord })[]> {
    return (await this.prisma.participant.findMany({
      where: { userId },
      include: { conversation: true },
    })) as unknown as (ParticipantRecord & { conversation: ConversationRecord })[];
  }
}
