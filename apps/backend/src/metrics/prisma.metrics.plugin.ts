import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prismaQueryDurationSeconds } from './metrics.service.js';

// Attach middleware to measure Prisma query durations.
export function attachPrismaMetrics(client: PrismaClient): void {
  client.$use(
    async (
      params: Prisma.MiddlewareParams,
      next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
    ): Promise<unknown> => {
      const start = process.hrtime.bigint();
      try {
        const result = await next(params);
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSec = durationNs / 1e9;
        const model = params.model ?? 'raw';
        const action = String(params.action);
        prismaQueryDurationSeconds.labels(model, action).observe(durationSec);
        return result;
      } catch (e) {
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSec = durationNs / 1e9;
        prismaQueryDurationSeconds
          .labels(params.model ?? 'raw', String(params.action))
          .observe(durationSec);
        throw e;
      }
    },
  );
}
