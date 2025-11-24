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
        if (driver === 's3') {
          return s3;
        }
        return local;
      },
    },
  ],
  exports: [MediaService, MediaCleanupService],
})
export class MediaModule {}
