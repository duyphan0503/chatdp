import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

interface ThrottlerRecord {
  totalHits: number;
  timeToExpire: number;
}

/**
 * Redis-backed implementation of Nest's ThrottlerStorage.
 *
 * This is used to share rate-limit counters across multiple backend instances
 * when REDIS_URL is configured. When REDIS_URL is not set, the default
 * in-memory storage from @nestjs/throttler is used instead.
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly prefix: string;

  constructor(
    private readonly client: Redis,
    options?: {
      /** Optional key prefix, defaults to `throttle` */
      prefix?: string;
    },
  ) {
    this.prefix = options?.prefix ?? 'throttle';
  }

  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Increment the hit counter for a key and set expiry when needed.
   *
   * Nest passes TTL in seconds; Redis uses milliseconds for pexpire/pttl.
   */
  async increment(key: string, ttl: number): Promise<ThrottlerRecord> {
    const redisKey = this.buildKey(key);

    // Use MULTI to increment and read TTL in a single round-trip.
    const pipeline = this.client.multi().incr(redisKey).pttl(redisKey);
    const results = await pipeline.exec();

    if (!results) {
      // Fallback: treat as first hit with full TTL.
      await this.client.set(redisKey, '1', 'EX', ttl);
      return { totalHits: 1, timeToExpire: ttl };
    }

    const [, incrResult] = results[0] ?? [null, 1];
    const [, ttlResult] = results[1] ?? [null, -1];

    const totalHits = typeof incrResult === 'number' ? incrResult : Number(incrResult ?? 1);

    let ttlSeconds: number;
    if (typeof ttlResult === 'number' && ttlResult >= 0) {
      // ttlResult is in milliseconds; convert to seconds (rounded up).
      ttlSeconds = Math.max(0, Math.ceil(ttlResult / 1000));
    } else {
      // No TTL set yet; apply one now.
      await this.client.pexpire(redisKey, ttl * 1000);
      ttlSeconds = ttl;
    }

    return {
      totalHits,
      timeToExpire: ttlSeconds,
    };
  }
}
