import { z } from 'zod';

/**
 * Zod schema: single source of truth cho biến môi trường.
 * Khi cần thêm/sửa ràng buộc, chỉ cập nhật tại đây.
 */
export const envSchema = z.object({
  // Default + enum
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Coerced number (int, port range)
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Required URL + custom required_error + định dạng .url()
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid URL (postgres://user:pass@host:5432/dbname)'),

  // Required secret với min length (≥ 32 để tránh brute-force dễ)
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),

  // TTL strings (vd “15m”, “7d”) – vẫn là string, logic parse ở runtime nơi cần
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Boolean flags cho ràng buộc refresh token (coerce từ “true/false/1/0”)
  REFRESH_BIND_UA_IP: z.coerce.boolean().default(true),
  REFRESH_BIND_UA: z.coerce.boolean().default(true),
  REFRESH_BIND_IP: z.coerce.boolean().default(true),

  // CORS origins CSV -> string[]
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

  // Logging level
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Trust proxy (for correct client IP behind reverse proxies)
  TRUST_PROXY: z.coerce.boolean().default(false),

  // Optional URL ví dụ thêm
  FRONTEND_URL: z.string().url().optional(),
});

// TypeScript type tự động suy ra từ schema (single source of truth)
export type Env = z.infer<typeof envSchema>;
