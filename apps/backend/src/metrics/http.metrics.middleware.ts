import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
  httpRequestsInFlight,
} from './metrics.service.js';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();
    httpRequestsInFlight.inc();

    const done = (): void => {
      try {
        httpRequestsInFlight.dec();
      } catch {
        /* noop */
      }
    };

    res.on('finish', () => {
      try {
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSec = durationNs / 1e9;
        const route = req.path ?? 'unknown';
        const method = req.method;
        const statusCode = String(res.statusCode);
        httpRequestDurationSeconds.labels(method, route, statusCode).observe(durationSec);
        httpRequestsTotal.labels(method, route, statusCode).inc(1);
      } catch {
        // ignore metrics errors
      } finally {
        done();
      }
    });

    res.on('close', done);

    next();
  }
}
