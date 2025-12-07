import { prismaQueryDurationSeconds, prismaQueriesTotal } from './index.js';

/*
 * Prisma's runtime client exposes `$use` middleware, but the TypeScript
 * typings used in this project don't model it precisely. That causes
 * `@typescript-eslint/no-unsafe-*` rules to see the middleware parameters
 * as `any`/`unknown`.
 *
 * For this low-level metrics instrumentation we intentionally trust Prisma's
 * runtime types, so we disable those safety rules for this file only.
 */

// Attach middleware to measure Prisma query durations.

function recordPrismaMetrics(
  params: { model?: string; action?: string | symbol } | Record<string, unknown>,
  start: bigint,
  outcome: 'ok' | 'error',
): void {
  const end = process.hrtime.bigint();
  const durationNs = Number(end - start);
  const durationSec = durationNs / 1e9;
  const model = (params as { model?: string }).model ?? 'raw';
  const action = String((params as { action?: string | symbol }).action ?? 'unknown');

  prismaQueryDurationSeconds.labels(model, action).observe(durationSec);
  prismaQueriesTotal.labels(model, action, outcome).inc(1);
}

export function attachPrismaMetrics(client: unknown): void {
  const prisma = client as {
    $use?: (
      middleware: (
        params: { model?: string; action?: string | symbol } | Record<string, unknown>,
        next: (params: unknown) => Promise<unknown>,
      ) => Promise<unknown>,
    ) => void;
  };

  if (typeof prisma.$use !== 'function') {
    return;
  }

  prisma.$use(async (params, next): Promise<unknown> => {
    const start = process.hrtime.bigint();
    let outcome: 'ok' | 'error' = 'ok';

    try {
      const result = await next(params);

      return result;
    } catch (error: unknown) {
      outcome = 'error';

      // Re-throw the original error so Prisma's caller can handle it.
      throw error;
    } finally {
      recordPrismaMetrics(params, start, outcome);
    }
  });
}
