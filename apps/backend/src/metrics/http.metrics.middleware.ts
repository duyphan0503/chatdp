import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics.service.js';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      try {
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSec = durationNs / 1e9;
        const route = (req.route && (req.route.path as string)) || req.path || 'unknown';
        const labels = {
          method: req.method,
          route,
          status_code: String(res.statusCode),
        } as const;
        httpRequestDurationSeconds.observe(labels as any, durationSec);
        httpRequestsTotal.inc(labels as any, 1);
      } catch {
        // ignore metrics errors
      }
    });

    next();
  }
}
