import { z } from 'zod';

/**
 * Zod schema: single source of truth for environment variables.
 * When adding or updating constraints, update only this schema.
 */
export const envSchema = z.object({
  // Default + enum
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Coerced number (int, port range)
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Required URL + custom required_error + URL format validation via .url()
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid URL (postgres://user:pass@host:5432/dbname)'),

  // Required secret with minimum length (>= 32) to make brute-force attacks harder
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),

  // TTL strings (e.g. "15m", "7d") – kept as strings; parsing occurs at runtime where needed
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Boolean flags for refresh token constraints (coerced from "true/false/1/0")
  REFRESH_BIND_UA_IP: z.coerce.boolean().default(true),
  REFRESH_BIND_UA: z.coerce.boolean().default(true),
  REFRESH_BIND_IP: z.coerce.boolean().default(true),

  // CORS origins as CSV -> string[]
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((raw) => {
      const s = String(raw).trim();
      if (s === '*') return ['*'];
      return s
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }),

  // HTTP rate limiting (seconds + count)
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),

  // Auth-specific rate limiting
  RATE_LIMIT_AUTH_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_AUTH_LIMIT: z.coerce.number().int().positive().default(5),

  // WS rate limiting (seconds + count)
  WS_RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  WS_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(120),

  // WS call initiation rate limiting (seconds + count)
  WS_CALL_RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  WS_CALL_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(30),

  // Logging level
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Trust proxy (for correct client IP behind reverse proxies)
  TRUST_PROXY: z.coerce.boolean().default(false),

  // Optional frontend URL (for redirects, deep links, etc.)
  FRONTEND_URL: z.string().url().optional(),

  // Optional API base URL (for logging, links, etc.)
  API_BASE_URL: z.string().url().optional(),

  // Redis cache URL (optional, Phase 7 - Hardening)
  REDIS_URL: z.string().url().optional(),

  // MongoDB read model (optional, Polyglot Persistence)
  MONGODB_URI: z.string().optional(),
  MONGODB_DBNAME: z.string().optional(),
  // Boolean-like flag with robust string parsing so that
  // USE_MONGO_READ_MODEL=false in .env is correctly interpreted
  // as boolean false (z.coerce.boolean() would treat 'false' as true).
  USE_MONGO_READ_MODEL: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((raw): boolean => {
      if (raw === undefined) return false;
      if (typeof raw === 'boolean') return raw;
      const val = raw.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(val)) return true;
      if (['false', '0', 'no', 'off'].includes(val)) return false;
      return Boolean(raw);
    }),

  // Background projector for Mongo read model. Similar robust boolean
  // parsing as USE_MONGO_READ_MODEL so that string "false" disables it.
  MONGO_PROJECTOR_ENABLED: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((raw): boolean => {
      if (raw === undefined) return true;
      if (typeof raw === 'boolean') return raw;
      const val = raw.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(val)) return true;
      if (['false', '0', 'no', 'off'].includes(val)) return false;
      return Boolean(raw);
    }),
  MONGO_PROJECTOR_INTERVAL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
  MONGO_PROJECTOR_BATCH_SIZE: z.coerce.number().int().min(1).max(1_000).default(100),

  // Media storage (Phase 9 - Media & Groups)

  // Driver selection: "local" (fake URLs) or "s3" (S3/MinIO-compatible).

  MEDIA_STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),

  MEDIA_S3_BUCKET: z.string().optional(),
  MEDIA_S3_REGION: z.string().optional(),
  MEDIA_S3_ENDPOINT: z.string().url().optional(),
  MEDIA_S3_ACCESS_KEY: z.string().optional(),
  MEDIA_S3_SECRET_KEY: z.string().optional(),
  // Optional public base URL for serving media (e.g. CDN)
  MEDIA_PUBLIC_BASE_URL: z.string().url().optional(),
  // Presigned URL TTL in seconds
  MEDIA_PRESIGN_EXPIRES_IN: z.coerce.number().int().positive().default(300),

  // Media TTL and R2 quota (soft/hard limits in bytes)
  MEDIA_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60),
  MEDIA_R2_SOFT_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(9 * 1024 * 1024 * 1024),
  MEDIA_R2_HARD_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024 * 1024),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),

  // SMTP / Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),

  // Redis Password (if needed)
  REDIS_PASSWORD: z.string().optional(),
});

// TypeScript type automatically inferred from the schema (single source of truth)
export type Env = z.infer<typeof envSchema>;
