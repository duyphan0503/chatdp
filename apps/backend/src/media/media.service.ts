import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface PresignedUpload {
  uploadUrl: string;
  downloadUrl?: string;
  fields?: Record<string, string>;
  expiresIn: number;
}

export interface DeleteObjectParams {
  url?: string;
  objectKey?: string;
}

export interface MediaStorage {
  createPresignedUpload(params: {
    fileName: string;
    mimeType: string;
    contentLength?: number;
    uploaderId: string;
  }): Promise<PresignedUpload>;

  deleteObject?(params: DeleteObjectParams): Promise<void>;
}

// Injection token for MediaStorage implementation
export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');

@Injectable()
export class MediaQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  private async getCurrentTotalSize(): Promise<number> {
    const aggregate = await this.prisma.media.aggregate({
      _sum: { size: true },
    });
    return aggregate._sum.size ?? 0;
  }

  async enforceQuotaForUpload(estimatedSize: number): Promise<void> {
    const softLimit = this.config.get('MEDIA_R2_SOFT_LIMIT_BYTES', { infer: true });
    const hardLimit = this.config.get('MEDIA_R2_HARD_LIMIT_BYTES', { infer: true });

    const current = await this.getCurrentTotalSize();
    const projected = current + (estimatedSize || 0);

    if (projected <= softLimit) {
      return;
    }

    // Try to evict until we're under the soft limit
    await this.evictUntilUnder(softLimit - (estimatedSize || 0));

    const afterEvict = await this.getCurrentTotalSize();
    const finalProjected = afterEvict + (estimatedSize || 0);
    if (finalProjected > hardLimit) {
      throw new ServiceUnavailableException('media storage quota exceeded');
    }
  }

  private async evictUntilUnder(targetBytes: number): Promise<void> {
    if (targetBytes < 0) {
      targetBytes = 0;
    }

    let total = await this.getCurrentTotalSize();
    if (total <= targetBytes) {
      return;
    }

    // Simple eviction strategy: oldest by expiresAt, then lastAccessAt, then createdAt
    const candidates = await this.prisma.media.findMany({
      where: {
        storageProvider: 'r2',
      },
      orderBy: [{ expiresAt: 'asc' }, { lastAccessAt: 'asc' }, { createdAt: 'asc' }],
      take: 100,
    });

    for (const media of candidates) {
      if (total <= targetBytes) {
        break;
      }

      try {
        if (this.storage.deleteObject) {
          await this.storage.deleteObject({
            url: media.url,
            objectKey: media.objectKey ?? undefined,
          });
        }
      } catch {
        // Swallow storage deletion errors; DB row will still be removed.
      }

      await this.prisma.media.delete({ where: { id: media.id } });
      total -= media.size ?? 0;
    }
  }
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly quota: MediaQuotaService,
    private readonly prisma: PrismaService,
  ) {}

  async presignUpload(input: {
    fileName: string;
    mimeType: string;
    contentLength?: number;
    uploaderId: string;
  }): Promise<PresignedUpload> {
    await this.quota.enforceQuotaForUpload(input.contentLength ?? 0);
    return this.storage.createPresignedUpload(input);
  }

  async markAccessed(mediaId: string, userId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!media) {
      return; // idempotent no-op if media row is already gone
    }

    const isUploader = media.uploaderId === userId;
    const isParticipant = media.conversation
      ? media.conversation.participants.some((p) => p.userId === userId)
      : false;

    if (!isUploader && !isParticipant) {
      this.logger.warn(
        `markAccessed forbidden: mediaId=${mediaId}, userId=${userId}, uploaderId=${media.uploaderId}, conversationId=${media.conversationId ?? 'null'}`,
      );
      throw new ForbiddenException('not allowed to access this media');
    }

    const now = new Date();

    const updateData: {
      lastAccessAt: Date;
      status?: string | null;
      storageProvider?: string | null;
      size?: number | null;
    } = {
      lastAccessAt: now,
    };

    if (media.storageProvider === 'r2') {
      if (this.storage.deleteObject) {
        try {
          await this.storage.deleteObject({
            url: media.url,
            objectKey: media.objectKey ?? undefined,
          });
        } catch (err) {
          this.logger.warn(
            `Failed to delete media object during markAccessed: mediaId=${mediaId}, error=${String(
              err,
            )}`,
          );
        }
      }

      updateData.status = 'cloud_deleted';
      updateData.storageProvider = 'none';
      updateData.size = 0;
    }

    await this.prisma.media.update({
      where: { id: mediaId },
      data: updateData,
    });
  }
}
