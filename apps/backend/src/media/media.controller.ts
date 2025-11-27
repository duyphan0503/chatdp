import {
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MediaService } from './media.service.js';
import { MediaPresignRequestDto, MediaPresignResponseDto } from './dto/media-presign.dto.js';

// Phase 9 — Media Upload
// This controller issues presigned URLs (S3/MinIO) for uploads.
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  async presign(
    @Query() dto: MediaPresignRequestDto,
    @Req() req: Request,
  ): Promise<MediaPresignResponseDto> {
    const { userId } = req.user as { userId: string };

    const result = await this.mediaService.presignUpload({
      fileName: dto.fileName,
      mimeType: dto.mime,
      contentLength: dto.contentLength,
      uploaderId: userId,
    });

    return {
      uploadUrl: result.uploadUrl,
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
    };
  }

  @Post(':id/accessed')
  @HttpCode(200)
  async markAccessed(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<{ status: 'ok' }> {
    const { userId } = req.user as { userId: string };
    await this.mediaService.markAccessed(id, userId);
    return { status: 'ok' };
  }
}
