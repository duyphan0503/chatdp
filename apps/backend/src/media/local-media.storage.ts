import { Injectable } from '@nestjs/common';
import { MediaStorage, PresignedUpload } from './media.service.js';

// NOTE: This is a placeholder storage adapter.
// In production, replace with S3/MinIO implementation that uses env-driven config.
@Injectable()
export class LocalMediaStorage implements MediaStorage {
  async createPresignedUpload(params: {
    fileName: string;
    mimeType: string;
    contentLength?: number;
    uploaderId: string;
  }): Promise<PresignedUpload> {
    // For now we just return a fake URL shape.
    // The goal is to have a stable contract for the REST layer and clients.
    return {
      uploadUrl: `https://example-upload/${encodeURIComponent(params.fileName)}`,
      downloadUrl: `https://example-download/${encodeURIComponent(params.fileName)}`,
      expiresIn: 300,
    };
  }

  // No-op delete for local/dev storage
  async deleteObject(): Promise<void> {
    return;
  }
}
