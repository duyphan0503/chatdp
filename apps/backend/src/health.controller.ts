import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.schema.js';
import { CorrelatedLogger } from './logging/logger.module.js';
/**
 * Health and readiness probe endpoints for infrastructure.
 *
 * Exposes a lightweight liveness check and a more expensive readiness check
 * that verifies database connectivity before reporting the service as ready.
 */
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly logger: CorrelatedLogger,
  ) {}

  /**
   * Lightweight liveness probe used by load balancers/orchestrators to
   * verify that the process is up.
   */
  @Get('healthz')
  getHealth(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() } as const;
  }

  /**
   * Readiness probe that checks downstream dependencies, currently the
   * primary database. Returns a structured payload indicating DB status.
   */
  @Get('ready')
  async getReady(): Promise<{ status: 'ready'; timestamp: string; deps: { db: 'ok' | 'down' } }> {
    const timestamp = new Date().toISOString();
    const dbUrl = this.config.get('DATABASE_URL', { infer: true });
    if (!dbUrl) {
      // In environments without DB, consider system ready
      return { status: 'ready', timestamp, deps: { db: 'ok' } } as const;
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', timestamp, deps: { db: 'ok' } } as const;
    } catch (error) {
      this.logger.error('Database readiness check failed', error);
      throw new ServiceUnavailableException({ status: 'ready', timestamp, deps: { db: 'down' } });
    }
  }
}
