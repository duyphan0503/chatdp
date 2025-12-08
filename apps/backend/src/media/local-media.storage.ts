import { Injectable } from '@nestjs/common';
import { MediaStorage, PresignedUpload } from './media.service.js';

// NOTE: This is a placeholder storage adapter.
// It is intended *only* for local development / tests to exercise
// the HTTP contract without touching real storage.
//
// In production, always use the S3/MinIO (R2) adapter via
// MEDIA_STORAGE_DRIVER=s3. The hybrid media architecture defines
// Local-First as a client-side concern; the backend should not
// pretend to store media on user devices via this adapter.
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
