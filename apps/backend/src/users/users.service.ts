import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserRepository, UserRecord } from '../repositories/user.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getCachedById(id: string): Promise<UserRecord | null> {
    const cacheKey = `user:by-id:${id}`;

    const cached = (await this.cache.get<UserRecord | null>(cacheKey)) ?? null;
    if (cached) return cached;

    const record = await this.users.findById(id);
    if (record) {
      await this.cache.set(cacheKey, record);
    }
    return record;
  }
}
