import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

function parseCorsOrigins(
  envValue?: string,
):
  | string[]
  | true
  | RegExp
  | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) {
  // Default to allow all in dev if not set, but recommend setting CORS_ORIGINS in production
  if (!envValue) return true;
  const raw = envValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length === 0) return true;
  if (raw.includes('*')) return true;
  return raw;
}

// Narrowed types to avoid any-casts while accessing Express instance
interface HttpAdapterLike {
  getInstance: () => unknown;
}

interface ExpressLike {
  set: (key: string, value: unknown) => void;
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
  // Security headers
  app.use(helmet());

  // Trust proxy if explicitly enabled (for accurate client IP)
  if ((process.env.TRUST_PROXY ?? '').toLowerCase() === 'true') {
    const express = getExpressInstance(app);
    if (express) {
      express.set('trust proxy', true);
    }
  }

  // CORS allowlist from env (CSV or '*')
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api');
}
