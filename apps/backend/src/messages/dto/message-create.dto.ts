import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class MessageCreateDto {
  @IsEnum(['text', 'image', 'video', 'file', 'voice'])
  contentType!: 'text' | 'image' | 'video' | 'file' | 'voice';

  @ValidateIf(o => o.contentType === 'text')
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  // For non-text messages we may have a mediaUrl (presigned later in Phase 9)
  @ValidateIf(o => o.contentType !== 'text')
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
