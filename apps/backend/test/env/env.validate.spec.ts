import { validate } from '../../src/config/env.validate.js';

describe('Environment validation', () => {
  it('passes with minimal valid env', () => {
    const raw = {
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'https://example.com',
      JWT_SECRET: 'x'.repeat(32),
      CORS_ORIGINS: '*',
    } as Record<string, unknown>;
    const validated = validate(raw);
    expect(validated.PORT).toBe(4000);
    expect(validated.CORS_ORIGINS).toEqual(['*']);
  });

  it('fails when required JWT_SECRET too short', () => {
    const raw = {
      NODE_ENV: 'test',
      PORT: '3000',
      DATABASE_URL: 'https://example.com',
      JWT_SECRET: 'short',
      CORS_ORIGINS: '*',
    } as Record<string, unknown>;
    expect(() => validate(raw)).toThrow(/Environment validation failed/);
  });

  it('transforms CSV CORS_ORIGINS correctly', () => {
    const raw = {
      NODE_ENV: 'development',
      PORT: '3001',
      DATABASE_URL: 'https://example.com',
      JWT_SECRET: 'y'.repeat(40),
      CORS_ORIGINS: 'https://a.test, https://b.test , https://c.test',
    } as Record<string, unknown>;
    const validated = validate(raw);
    expect(validated.CORS_ORIGINS).toEqual([
      'https://a.test',
      'https://b.test',
      'https://c.test',
    ]);
  });

  it('applies defaults (PORT, RATE_LIMIT_TTL) when omitted', () => {
    const raw = {
      DATABASE_URL: 'https://example.com',
      JWT_SECRET: 'z'.repeat(33),
    } as Record<string, unknown>;
    const validated = validate(raw);
    expect(validated.PORT).toBe(3000); // default
    expect(validated.RATE_LIMIT_TTL).toBe(60); // default
  });
});
