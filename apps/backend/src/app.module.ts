import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisThrottlerStorage } from './throttler/redis-throttler.storage.js';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { EnvConfigModule } from './config/env.config.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import type { Env } from './config/env.schema.js';
import { MetricsModule } from './metrics/index.js';
import { MetricsController } from './metrics/index.js';
import { LoggerModule } from './logging/logger.module.js';
import { CacheConfigModule } from './cache/cache.module.js';
import { MediaModule } from './media/media.module.js';
import { MongoReadModelModule } from './mongo/mongo-read-model.module.js';

@Module({
  imports: [
    // Load environment variables and make ConfigService globally available
    EnvConfigModule,
    CacheConfigModule,
    LoggerModule,
    MetricsModule,
    // Basic rate limiting; configurable via env
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const ttl = config.get('RATE_LIMIT_TTL', { infer: true });
        const limit = config.get('RATE_LIMIT_LIMIT', { infer: true });
        const authTtl = config.get('RATE_LIMIT_AUTH_TTL', { infer: true });
        const authLimit = config.get('RATE_LIMIT_AUTH_LIMIT', { infer: true });
        const redisUrl = config.get('REDIS_URL', { infer: true });

        const throttlers = [
          {
            ttl,
            limit,
          },
          {
            name: 'auth',
            ttl: authTtl,
            limit: authLimit,
          },
        ];

        if (!redisUrl) {
          // Default in-memory throttling when Redis is not configured.
          return throttlers;
        }

        // In test environments we prefer in-memory throttling even when
        // REDIS_URL is configured, to avoid coupling E2E tests to an
        // external Redis instance that may not be reachable.
        if (process.env.NODE_ENV === 'test') {
          return throttlers;
        }

        // When REDIS_URL is set, use shared Redis-backed storage.
        const client = new Redis(redisUrl);
        const storage = new RedisThrottlerStorage(client, { prefix: 'throttle' });

        return {
          storage,
          throttlers,
        };
      },
    }),
    // Persistence and core services
    PrismaModule,
    // Authentication and user management
    AuthModule,
    UsersModule,
    // Conversations and messaging API
    ConversationsModule,
    MessagesModule,
    // Realtime/WebSocket signalling and subscriptions
    RealtimeModule,
    // Media upload and retrieval
    MediaModule,
    // Optional MongoDB read model for fast timelines
    MongoReadModelModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
