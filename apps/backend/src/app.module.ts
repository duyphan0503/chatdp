import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { EnvConfigModule } from './config/env.config.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [
    // Load environment variables and make ConfigService globally available
    EnvConfigModule,
    // Basic rate limiting; configurable via env
    ThrottlerModule.forRoot([
      {
        ttl: Number.isFinite(Number(process.env.RATE_LIMIT_TTL))
          ? Number(process.env.RATE_LIMIT_TTL)
          : 60,
        limit: Number.isFinite(Number(process.env.RATE_LIMIT_LIMIT))
          ? Number(process.env.RATE_LIMIT_LIMIT)
          : 100,
      },
      {
        name: 'auth',
        ttl: Number.isFinite(Number(process.env.RATE_LIMIT_AUTH_TTL))
          ? Number(process.env.RATE_LIMIT_AUTH_TTL)
          : 60,
        limit: Number.isFinite(Number(process.env.RATE_LIMIT_AUTH_LIMIT))
          ? Number(process.env.RATE_LIMIT_AUTH_LIMIT)
          : 5,
      },
    ]),
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
  controllers: [HealthController],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
