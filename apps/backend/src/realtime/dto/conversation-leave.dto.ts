import { IsString } from 'class-validator';

export class ConversationLeaveDto {
  @IsString()
  conversationId!: string;
}
