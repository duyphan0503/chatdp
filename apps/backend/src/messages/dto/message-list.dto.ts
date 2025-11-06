import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class MessageListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID('4')
  cursor?: string; // message id used as pagination cursor

  @IsOptional()
  @IsString()
  conversationId?: string; // Filled from route params in controller
}
