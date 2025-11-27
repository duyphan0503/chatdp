export class MediaPresignRequestDto {
  fileName!: string;
  mime!: string;
  contentLength?: number;
}

export class MediaPresignResponseDto {
  uploadUrl!: string;
  downloadUrl?: string;
  expiresIn!: number;
}
