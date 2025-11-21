import { IsString } from 'class-validator';

export class MessageReadDto {
  @IsString()
  messageId!: string;
}
