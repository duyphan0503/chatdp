import { Injectable } from '@nestjs/common';

// Minimal in-memory presence tracking. Scoped to a single process.
// For multi-instance deployments, replace with a shared adapter (e.g., Redis) later.
@Injectable()
export class PresenceRegistry {
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly joinedConversations = new Map<string, Set<string>>(); // userId -> convIds

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

  joinConversation(userId: string, conversationId: string): number {
    const set = this.joinedConversations.get(userId) ?? new Set<string>();
    set.add(conversationId);
    this.joinedConversations.set(userId, set);
    return set.size;
  }

  leaveConversation(userId: string, conversationId: string): number {
    const set = this.joinedConversations.get(userId);
    if (!set) return 0;
    set.delete(conversationId);
    if (set.size === 0) this.joinedConversations.delete(userId);
    return set.size;
  }

  getJoinedConversations(userId: string): string[] {
    return Array.from(this.joinedConversations.get(userId) ?? []);
  }

  clearUser(userId: string): { socketsCleared: number; conversations: string[] } {
    const socketsCleared = this.userSockets.get(userId)?.size ?? 0;
    const conversations = this.getJoinedConversations(userId);
    this.userSockets.delete(userId);
    this.joinedConversations.delete(userId);
    return { socketsCleared, conversations };
  }
}
