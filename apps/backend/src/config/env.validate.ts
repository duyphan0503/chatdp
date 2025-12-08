import { envSchema, type Env } from './env.schema.js';

/**
 * Parse and validate all environment variables using Zod.
 * - Returns a normalized Env object (coercion, defaults, transforms).
 * - Logs detailed errors and throws an exception to fail fast.
 */
export function validate(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    // format() to produce a full structured error tree
    const formatted = parsed.error.format();
    console.error(
      '[ENV] Validation failed. Structured errors:\n',
      JSON.stringify(formatted, null, 2),
    );
    // Flat list of issues for quick reading
    console.error('[ENV] Issues:');
    for (const issue of parsed.error.issues) {
      console.error(` - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }

    throw new Error('Environment validation failed (see logs above)');
  }
  return parsed.data;
}
