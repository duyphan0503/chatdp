import { IsString } from 'class-validator';

export class MessageReactionDto {
  @IsString()
  messageId!: string;

  @IsString()
  emoji!: string;
}
