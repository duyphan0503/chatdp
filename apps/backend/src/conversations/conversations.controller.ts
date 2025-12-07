import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConversationsService, ConversationWithParticipants } from './conversations.service.js';
import { ConversationCreateDto } from './dto/conversation-create.dto.js';
import { ConversationUpdateDto } from './dto/conversation-update.dto.js';
import { GroupMemberAddDto } from './dto/group-member.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request } from 'express';
// API response intentionally omits participant list to keep the public schema minimal.
// Internal service still returns participants for authorization and business logic; the
// controller maps them out before sending the response to clients.
interface ConversationResponse {
  id: string;
  type: 'private' | 'group';
  groupName: string | null;
  groupAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapConversation(c: ConversationWithParticipants): ConversationResponse {
  const { id, type, groupName, groupAvatarUrl, createdAt, updatedAt } = c;
  return { id, type, groupName, groupAvatarUrl, createdAt, updatedAt };
}

/**
 * HTTP endpoints for creating and managing conversations.
 *
 * Supports private 1-1 and group conversations, including membership
 * management and simple role-based administration within groups.
 */
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  /**
   * Creates a new conversation for the authenticated user.
   *
   * - For private conversations, enforces exactly one other participant.
   * - For groups, allows optional initial member list and metadata.
   */
  @Post()
  async create(
    @Body() dto: ConversationCreateDto,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.create(userId, dto);
    return mapConversation(conv);
  }

  /**
   * Lists all conversations visible to the authenticated user, ordered by
   * most recently updated.
   */
  @Get()
  async list(@Req() req: Request): Promise<ConversationResponse[]> {
    const { userId } = req.user as { userId: string };
    const convs = await this.conversations.listForUser(userId);
    return convs.map(mapConversation);
  }

  /**
   * Returns a single conversation by id, ensuring the caller is a participant.
   */
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.findById(id, userId);
    return mapConversation(conv);
  }

  /**
   * Lets the authenticated user join a group conversation they are allowed
   * to access. Private conversations cannot be joined this way.
   */
  @Post(':id/join')
  async join(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.join(id, userId);
    return mapConversation(conv);
  }

  /**
   * Updates group metadata (e.g. name, avatar). Only group admins may
   * perform this operation.
   */
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ConversationUpdateDto,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.update(id, userId, dto);
    return mapConversation(conv);
  }

  /**
   * Adds a member to a group conversation. The authenticated user must be
   * a participant with admin role in that conversation.
   */
  @Post(':id/members')
  async addMember(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: GroupMemberAddDto,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.addMember(id, userId, dto.userId);
    return mapConversation(conv);
  }

  /**
   * Removes a member from a group conversation. The authenticated user must
   * be an admin and the last remaining admin cannot be removed.
   */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.removeMember(id, userId, memberId);
    return mapConversation(conv);
  }

  /**
   * Promotes a group member to admin within the conversation.
   */
  @Post(':id/members/:memberId/promote')
  async promoteMember(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.setMemberRole(id, userId, memberId, 'admin');
    return mapConversation(conv);
  }

  /**
   * Demotes an admin back to member role. The last remaining admin in the
   * group cannot be demoted.
   */
  @Post(':id/members/:memberId/demote')
  async demoteMember(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Req() req: Request,
  ): Promise<ConversationResponse> {
    const { userId } = req.user as { userId: string };
    const conv = await this.conversations.setMemberRole(id, userId, memberId, 'member');
    return mapConversation(conv);
  }
}
