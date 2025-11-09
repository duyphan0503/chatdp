import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Env } from './config/env.schema.js';

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
  const config = app.get(ConfigService<Env, true>);

  // Security headers
  app.use(helmet());

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

  // Global API prefix
  app.setGlobalPrefix('api');
}
