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

  // Load .env if it exists (for CI or local dev)
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        // Only set if not already set (preserve system env vars)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }

  // Load .env.test.local if it exists (for local overrides)
  const localEnvPath = path.join(rootDir, '.env.test.local');
  if (fs.existsSync(localEnvPath)) {
    const content = fs.readFileSync(localEnvPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        // Force override for local test config
        process.env[key] = value;
      }
    });
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
    // Default to a placeholder that will fail unless overridden by env vars
    // User must provide DATABASE_URL in environment or .env file
    process.env.DATABASE_URL = 'postgresql://user:pass@127.0.0.1:5432/db';
  }

  // Ensure REDIS_URL is present for local tests
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://:pass@127.0.0.1:6379';
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
  console.warn('[jest-setup] Failed to provision test env:', e && e.message);
}
