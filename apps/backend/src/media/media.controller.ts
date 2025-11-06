import { Controller, Post, Query } from '@nestjs/common';

// Phase 9 — Media Upload skeleton
// In Phase 9, this controller will issue presigned URLs (S3/MinIO) and accept upload callbacks.
@Controller('media')
export class MediaController {
  @Post('presign')
  presign(@Query('fileName') fileName: string, @Query('mime') mime: string) {
    // TODO: validate input, authN/Z, size limits, content-type allowlist
    // For now, return a placeholder response
    return {
      uploadUrl: 'https://example-upload-url',
      downloadUrl: 'https://example-download-url',
      fileName,
      mime,
      expiresIn: 300,
    } as const;
  }
}
