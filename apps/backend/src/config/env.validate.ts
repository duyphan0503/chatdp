import { envSchema, type Env } from './env.schema.js';

/**
 * Parse & validate toàn bộ biến môi trường thông qua Zod.
 * - Trả về object Env đã chuẩn hóa (coercion, defaults, transform).
 * - In lỗi chi tiết và ném exception để fail-fast.
 */
export function validate(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    // format() cho cây lỗi đầy đủ
    const formatted = parsed.error.format();
    // eslint-disable-next-line no-console
    console.error(
      '[ENV] Validation failed. Structured errors:\n',
      JSON.stringify(formatted, null, 2),
    );
    // Flat list giúp đọc nhanh
    // eslint-disable-next-line no-console
    console.error('[ENV] Issues:');
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(` - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    throw new Error('Environment validation failed (see logs above)');
  }
  return parsed.data;
}
