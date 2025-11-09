import { PrismaClient } from '@prisma/client';
import { prismaQueryDurationSeconds } from './metrics.service.js';

// Attach middleware to measure Prisma query durations.
export function attachPrismaMetrics(client: PrismaClient): void {
  client.$use(async (params, next) => {
    const start = process.hrtime.bigint();
    try {
      const result = await next(params);
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationSec = durationNs / 1e9;
      prismaQueryDurationSeconds.observe({
        model: params.model || 'raw',
        action: params.action,
      } as any, durationSec);
      return result;
    } catch (e) {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationSec = durationNs / 1e9;
      prismaQueryDurationSeconds.observe({ model: params.model || 'raw', action: params.action } as any, durationSec);
      throw e;
    }
  });
}
