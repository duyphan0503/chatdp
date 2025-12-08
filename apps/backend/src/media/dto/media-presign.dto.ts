import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaPresignRequestDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(255)
  mime!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contentLength?: number;
}

export class MediaPresignResponseDto {
  uploadUrl!: string;
  downloadUrl?: string;
  expiresIn!: number;
}
