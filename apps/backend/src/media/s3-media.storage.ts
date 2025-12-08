import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../config/env.schema.js';
import type { DeleteObjectParams, MediaStorage, PresignedUpload } from './media.service.js';

/**
 * S3/MinIO-compatible MediaStorage implementation.
 *
 * - Controlled via env:
 *   - MEDIA_STORAGE_DRIVER=s3
 *   - MEDIA_S3_BUCKET
 *   - MEDIA_S3_REGION
 *   - MEDIA_S3_ENDPOINT (for MinIO/self-hosted, optional)
 *   - MEDIA_S3_ACCESS_KEY / MEDIA_S3_SECRET_KEY
 *   - MEDIA_PUBLIC_BASE_URL (optional, for CDN)
 *   - MEDIA_PRESIGN_EXPIRES_IN
 */
@Injectable()
export class S3MediaStorage implements MediaStorage {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly presignExpiresIn: number;
  private readonly publicBaseUrl?: string;
  private readonly endpoint?: string;
  private readonly logger = new Logger(S3MediaStorage.name);

  constructor(private readonly config: ConfigService<Env, true>) {
    const driver = this.config.get('MEDIA_STORAGE_DRIVER', { infer: true });

    this.bucket = this.config.get('MEDIA_S3_BUCKET', { infer: true }) ?? '';
    const region = this.config.get('MEDIA_S3_REGION', { infer: true });
    this.endpoint = this.config.get('MEDIA_S3_ENDPOINT', { infer: true });
    const accessKeyId = this.config.get('MEDIA_S3_ACCESS_KEY', { infer: true });
    const secretAccessKey = this.config.get('MEDIA_S3_SECRET_KEY', { infer: true });
    this.publicBaseUrl = this.config.get('MEDIA_PUBLIC_BASE_URL', { infer: true });
    this.presignExpiresIn = this.config.get('MEDIA_PRESIGN_EXPIRES_IN', { infer: true });

    // Only enforce strict requirements when driver is actually s3
    if (driver === 's3') {
      if (!this.bucket) {
        throw new Error('MEDIA_S3_BUCKET is required when MEDIA_STORAGE_DRIVER is "s3"');
      }
      if (!region) {
        throw new Error('MEDIA_S3_REGION is required when MEDIA_STORAGE_DRIVER is "s3"');
      }
    }

    this.s3 = new S3Client({
      region: region ?? 'us-east-1',
      endpoint: this.endpoint,
      // Path-style is required for many S3-compatible backends (MinIO, etc.)
      forcePathStyle: !!this.endpoint,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async createPresignedUpload(params: {
    fileName: string;
    mimeType: string;
    contentLength?: number;
    uploaderId: string;
  }): Promise<PresignedUpload> {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `uploads/${params.uploaderId}/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.contentLength,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: this.presignExpiresIn,
    });

    const downloadUrl = this.buildDownloadUrl(key);

    this.logger.debug(`Generated presigned upload for key=${key}`);

    return {
      uploadUrl,
      downloadUrl,
      expiresIn: this.presignExpiresIn,
    };
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const key = params.objectKey ?? this.extractKeyFromUrl(params.url);
    if (!key || !this.bucket) {
      return;
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.debug(`Deleted media object key=${key}`);
    } catch (err) {
      this.logger.warn(`Failed to delete media object key=${key}: ${String(err)}`);
    }
  }

  private extractKeyFromUrl(url?: string): string | undefined {
    if (!url) return undefined;

    // Heuristic: look for '/uploads/' segment and take the rest
    const marker = '/uploads/';
    const idx = url.indexOf(marker);
    if (idx === -1) return undefined;
    return url.substring(idx + 1); // keep 'uploads/...' as key
  }

  private buildDownloadUrl(key: string): string | undefined {
    if (this.publicBaseUrl) {
      const base = this.publicBaseUrl.replace(/\/+$/, '');
      return `${base}/${key}`;
    }

    if (this.endpoint) {
      const base = this.endpoint.replace(/\/+$/, '');
      return `${base}/${this.bucket}/${key}`;
    }

    // Default AWS S3 style
    if (this.bucket) {
      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }

    return undefined;
  }
}
