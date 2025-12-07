import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { attachPrismaMetrics } from '../metrics/index.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    const dbUrl = config.get('DATABASE_URL', { infer: true });

    const adapter = new PrismaPg({ connectionString: dbUrl });
    super({ adapter });

    // Attach Prisma metrics middleware early
    attachPrismaMetrics(this);
  }

  async onModuleInit() {
    // Always connect using the configured DATABASE_URL. Env validation
    // guarantees that this value is present and well-formed.
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    // Use Node's process beforeExit event to gracefully close Nest app
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
