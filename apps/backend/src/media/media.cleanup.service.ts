import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MEDIA_STORAGE, MediaStorage } from './media.service.js';

/**
 * MediaCleanupService
 *
 * Implements the "Cleanup Workers / Cron" responsibilities described in
 * docs/HYBRID_MEDIA_ARCHITECTURE.md:
 *
 * - Delete expired media objects from R2 (best-effort).
 * - Remove corresponding metadata rows from the database.
 *
 * This service is intentionally side-effect free with respect to scheduling;
 * it is designed to be invoked by an external scheduler (cron job, worker,
 * admin command, etc.).
 */
@Injectable()
export class MediaCleanupService {
  private readonly logger = new Logger(MediaCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  /**
   * Clean up a batch of expired media rows.
   *
   * @param now - Reference time (defaults to current time).
   * @param batchSize - Max number of rows to process in one invocation.
   */
  async cleanupExpiredMediaBatch(
    now: Date = new Date(),
    batchSize = 100,
  ): Promise<{ deletedCount: number }> {
    const expired = await this.prisma.media.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
      take: batchSize,
    });

    if (expired.length === 0) {
      return { deletedCount: 0 };
    }

    let deletedCount = 0;

    for (const media of expired) {
      if (this.storage.deleteObject && media.storageProvider === 'r2') {
        try {
          await this.storage.deleteObject({
            url: media.url,
            objectKey: media.objectKey ?? undefined,
          });
        } catch (err) {
          // Best-effort: log and continue with DB cleanup.
          this.logger.warn(
            `Failed to delete expired media object: mediaId=${media.id}, error=${String(err)}`,
          );
        }
      }

      await this.prisma.media.delete({ where: { id: media.id } });
      deletedCount += 1;
    }

    this.logger.debug(`Cleaned up ${deletedCount} expired media item(s).`);
    return { deletedCount };
  }
}
