// Jest E2E setup: ensure minimal env for local runs
// - Copies apps/backend/.env.example to .env if missing
// - Ensures strong JWT_SECRET and fast WS rate limits for tests

const fs = require('fs');
const path = require('path');

try {
  const rootDir = path.resolve(__dirname, '..'); // apps/backend
  const envPath = path.join(rootDir, '.env');
  const envExample = path.join(rootDir, '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
  }

  // Ensure robust defaults via process.env (do not overwrite if already set)
  if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 32) {
    process.env.JWT_SECRET = 'local_e2e_secret_abcdefghijklmnopqrstuvwxyz_123456';
  }
  // Speed up WS E2E
  if (!process.env.WS_RATE_LIMIT_TTL) process.env.WS_RATE_LIMIT_TTL = '2';
  if (!process.env.WS_RATE_LIMIT_LIMIT) process.env.WS_RATE_LIMIT_LIMIT = '2';

  // Ensure DATABASE_URL present (may still require a running DB when tests use it)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      'postgresql://chatdp:chatdp000000@127.0.0.1:5432/chatdp?schema=public';
  }

  // Ensure REDIS_URL present for Throttler/Cache
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://:chatdp000000@127.0.0.1:6379';
  }

  // Relax HTTP rate limiting for E2E runs to avoid flakiness
  if (!process.env.RATE_LIMIT_TTL) process.env.RATE_LIMIT_TTL = '60';
  if (!process.env.RATE_LIMIT_LIMIT) process.env.RATE_LIMIT_LIMIT = '500';

  // Ensure Mongo read model is disabled for Jest runs to avoid
  // connecting to external Mongo instances that may not be reachable
  // from the local test environment.
  process.env.USE_MONGO_READ_MODEL = 'false';
  process.env.MONGO_PROJECTOR_ENABLED = 'false';
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[jest-setup] Failed to provision test env:', e && e.message);
}
