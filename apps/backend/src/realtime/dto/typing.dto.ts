import { IsBoolean, IsString } from 'class-validator';

export class TypingDto {
  @IsString()
  conversationId!: string;

  @IsBoolean()
  isTyping!: boolean;
}
