import { IsString, IsOptional, IsIn } from 'class-validator';

const CONTENT_TYPES = ['text', 'image', 'video', 'file', 'voice'] as const;
export type ContentTypeDto = typeof CONTENT_TYPES[number];

export class MessageNewDto {
  @IsString()
  conversationId!: string;

  @IsString()
  @IsIn(CONTENT_TYPES as readonly string[])
  contentType!: ContentTypeDto;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
