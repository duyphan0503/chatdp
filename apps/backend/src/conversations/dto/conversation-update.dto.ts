import { IsOptional, IsString } from 'class-validator';

// DTO for updating group conversation metadata
export class ConversationUpdateDto {
  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsString()
  groupAvatarUrl?: string;
}
