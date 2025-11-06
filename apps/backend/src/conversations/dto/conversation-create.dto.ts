import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// DTO for creating a conversation (private or group)
// Service layer will enforce stricter rules:
// - private: participantUserIds must contain exactly one other user (creator is implicit)
// - group: participantUserIds optional; if provided 1..49 (creator joins separately)
export class ConversationCreateDto {
  @IsIn(['private', 'group'])
  type!: 'private' | 'group';

  // Participant user IDs (excluding the current authenticated user)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(49)
  @IsUUID('4', { each: true })
  participantUserIds?: string[];

  // Group metadata
  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsString()
  groupAvatarUrl?: string;
}
