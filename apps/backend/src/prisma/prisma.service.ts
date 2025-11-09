import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async onModuleInit() {
    // Only connect if DATABASE_URL is configured; otherwise skip to avoid test flakiness
    const dbUrl = this.config.get('DATABASE_URL');
    if (dbUrl) {
      await this.$connect();
    }
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
