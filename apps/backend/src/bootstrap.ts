import type { INestApplication, LogLevel } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Env } from './config/env.schema.js';
import type { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';
import { HttpMetricsMiddleware } from './metrics/http.metrics.middleware.js';

// Narrowed types to avoid any-casts while accessing Express instance
interface HttpAdapterLike {
  getInstance: () => unknown;
}

interface ExpressLike {
  set: (key: string, value: unknown) => void;
  use?: (...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) => void;
}

function getExpressInstance(app: INestApplication): ExpressLike | null {
  const maybeAdapter = (
    app as unknown as { getHttpAdapter?: () => HttpAdapterLike }
  ).getHttpAdapter?.();
  if (!maybeAdapter || typeof maybeAdapter.getInstance !== 'function') return null;
  const instance = maybeAdapter.getInstance();
  if (instance && typeof (instance as { set?: unknown }).set === 'function') {
    return instance as ExpressLike;
  }
  return null;
}

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);

  // Security headers
  app.use(helmet());

  // Configure log levels from env LOG_LEVEL
  const level = config.get('LOG_LEVEL', { infer: true });
  const levelsByMin: Record<Env['LOG_LEVEL'], LogLevel[]> = {
    fatal: ['error'],
    error: ['error'],
    warn: ['warn', 'error'],
    info: ['log', 'warn', 'error'],
    debug: ['debug', 'log', 'warn', 'error'],
    trace: ['verbose', 'debug', 'log', 'warn', 'error'],
  };
  app.useLogger(levelsByMin[level] ?? ['log', 'warn', 'error']);

  // Trust proxy if enabled (for accurate client IP behind reverse proxy)
  if (config.get('TRUST_PROXY', { infer: true })) {
    const express = getExpressInstance(app);
    if (express) {
      express.set('trust proxy', true);
    }
  }

  // CORS allowlist from validated env (already transformed to string[] or ['*'])
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  app.enableCors({ origin: corsOrigins.includes('*') ? true : corsOrigins, credentials: true });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Correlation ID + HTTP metrics middlewares (order matters: correlation id first)
  // We instantiate manually instead of using module-level consumer for simplicity in bootstrap.
  const correlation = new CorrelationIdMiddleware();
  const httpMetrics = new HttpMetricsMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => correlation.use(req, res, next));
  app.use((req: Request, res: Response, next: NextFunction) => httpMetrics.use(req, res, next));

  // Global API prefix
  app.setGlobalPrefix('api');
}
