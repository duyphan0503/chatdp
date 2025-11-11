import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.schema.js';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('healthz')
  getHealth(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() } as const;
  }

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
    } catch {
      throw new ServiceUnavailableException({ status: 'ready', timestamp, deps: { db: 'down' } });
    }
  }
}
