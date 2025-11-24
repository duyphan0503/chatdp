import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class MessageCreateDto {
  @IsEnum(['text', 'image', 'video', 'file', 'voice'])
  contentType!: 'text' | 'image' | 'video' | 'file' | 'voice';

  @ValidateIf((o: MessageCreateDto) => o.contentType === 'text')
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  // For non-text messages we may have a mediaUrl (presigned later in Phase 9)
  @ValidateIf((o: MessageCreateDto) => o.contentType !== 'text')
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ValidateIf((o: MessageCreateDto) => o.contentType !== 'text')
  @IsOptional()
  @IsString()
  mediaMimeType?: string;

  @ValidateIf((o: MessageCreateDto) => o.contentType !== 'text')
  @IsOptional()
  @IsInt()
  @Min(0)
  mediaSize?: number;

  @IsOptional()
  @IsString()
  contentId?: string;

  // Optional reply-to message
  @IsOptional()
  @IsUUID('4')
  replyToMessageId?: string;
}
