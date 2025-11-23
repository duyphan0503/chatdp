import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Note: we don't yet use ConfigService here to avoid unused-var lint;
      // REDIS_URL wiring will be added when a Redis store is plugged in.
      useFactory: () => {
        const ttlSeconds = 60; // default global TTL; specific keys can override

        return {
          ttl: ttlSeconds * 1000,
          // store: redisStore({ url: process.env.REDIS_URL }) when Redis store is wired
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}
