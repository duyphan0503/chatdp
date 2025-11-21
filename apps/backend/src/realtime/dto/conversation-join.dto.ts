import { IsString } from 'class-validator';

export class ConversationJoinDto {
  @IsString()
  conversationId!: string;
}
