import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Load environment variables and make ConfigService globally available
    ConfigModule.forRoot({ isGlobal: true }),
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
    ]),
    // Phase 2: Prisma module (global)
    PrismaModule,
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
