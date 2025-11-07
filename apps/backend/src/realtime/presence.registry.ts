import { Injectable } from '@nestjs/common';

// Minimal in-memory presence tracking. Scoped to a single process.
// For multi-instance deployments, replace with a shared adapter (e.g., Redis) later.
@Injectable()
export class PresenceRegistry {
  private readonly userSockets = new Map<string, Set<string>>();

  add(userId: string, socketId: string): number {
    const set = this.userSockets.get(userId) ?? new Set<string>();
    set.add(socketId);
    this.userSockets.set(userId, set);
    return set.size;
  }

  remove(userId: string, socketId: string): number {
    const set = this.userSockets.get(userId);
    if (!set) return 0;
    set.delete(socketId);
    if (set.size === 0) this.userSockets.delete(userId);
    return set.size;
  }

  getUserSocketIds(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) ?? []);
  }

  isOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  onlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
