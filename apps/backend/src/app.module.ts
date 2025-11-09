import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { EnvConfigModule } from './config/env.config.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import type { Env } from './config/env.schema.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { MetricsController } from './metrics/metrics.controller.js';
import { LoggerModule } from './logging/logger.module.js';
 
@Module({
  imports: [
    // Load environment variables and make ConfigService globally available
    EnvConfigModule,
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
        return [
          { ttl, limit },
          { name: 'auth', ttl: authTtl, limit: authLimit },
        ];
      },
    }),
    // Phase 2: Prisma module (global)
    PrismaModule,
    // Phase 3: Auth & Users modules
    AuthModule,
    UsersModule,
    // Phase 4: Conversations & Messages modules
    ConversationsModule,
    MessagesModule,
    // Phase 5: Realtime/WebSocket module
    RealtimeModule,
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

