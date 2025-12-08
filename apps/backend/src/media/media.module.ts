import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module.js';
import type { Env } from '../config/env.schema.js';
import { MediaController } from './media.controller.js';
import { MediaQuotaService, MediaService, MEDIA_STORAGE } from './media.service.js';
import { LocalMediaStorage } from './local-media.storage.js';
import { S3MediaStorage } from './s3-media.storage.js';
import { MediaCleanupService } from './media.cleanup.service.js';

@Module({
  imports: [PrismaModule, PassportModule, ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaQuotaService,
    MediaCleanupService,
    LocalMediaStorage,
    S3MediaStorage,
    {
      provide: MEDIA_STORAGE,
      inject: [ConfigService, LocalMediaStorage, S3MediaStorage],
      useFactory: (
        config: ConfigService<Env, true>,
        local: LocalMediaStorage,
        s3: S3MediaStorage,
      ) => {
        const driver = config.get('MEDIA_STORAGE_DRIVER', { infer: true });
        const nodeEnv = config.get('NODE_ENV', { infer: true });

        // In production, we require the real S3/R2-backed storage.
        // The local adapter is a dev-only stub and does not persist
        // or serve real media; using it in production would violate
        // the hybrid media architecture contract.
        if (nodeEnv === 'production' && driver !== 's3') {
          throw new Error(
            'MEDIA_STORAGE_DRIVER must be "s3" in production. The local media adapter is dev-only and should not be used in real deployments.',
          );
        }

        if (driver === 's3') {
          return s3;
        }

        // Dev / test fallback: in non-production environments, the
        // local adapter can be used as a no-op stub to exercise the
        // HTTP contract without touching real storage.
        return local;
      },
    },
  ],
  exports: [MediaService, MediaCleanupService],
})
export class MediaModule {}
