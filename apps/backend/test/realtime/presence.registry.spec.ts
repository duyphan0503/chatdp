import { PresenceRegistry } from '../../src/realtime/presence.registry.js';

describe('PresenceRegistry', () => {
  let registry: PresenceRegistry;
  beforeEach(() => {
    registry = new PresenceRegistry();
  });

  test('add & remove sockets updates counts and online state', () => {
    expect(registry.isOnline('u1')).toBe(false);
    expect(registry.add('u1', 's1')).toBe(1);
    expect(registry.isOnline('u1')).toBe(true);
    expect(registry.add('u1', 's2')).toBe(2);
    expect(registry.getUserSocketIds('u1').sort()).toEqual(['s1', 's2']);
    expect(registry.remove('u1', 's1')).toBe(1);
    expect(registry.isOnline('u1')).toBe(true);
    expect(registry.remove('u1', 's2')).toBe(0);
    expect(registry.isOnline('u1')).toBe(false);
  });

  test('join & leave conversations tracked per user', () => {
    registry.add('u1', 's1');
    expect(registry.joinConversation('u1', 'c1')).toBe(1);
    expect(registry.joinConversation('u1', 'c2')).toBe(2);
    expect(registry.getJoinedConversations('u1').sort()).toEqual(['c1', 'c2']);
    expect(registry.leaveConversation('u1', 'c1')).toBe(1);
    expect(registry.getJoinedConversations('u1')).toEqual(['c2']);
    expect(registry.leaveConversation('u1', 'c2')).toBe(0);
    expect(registry.getJoinedConversations('u1')).toEqual([]);
  });

  test('clearUser removes sockets and conversation joins', () => {
    registry.add('u1', 's1');
    registry.add('u1', 's2');
    registry.joinConversation('u1', 'c1');
    registry.joinConversation('u1', 'c2');
    const result = registry.clearUser('u1');
    expect(result.socketsCleared).toBe(2);
    expect(result.conversations.sort()).toEqual(['c1', 'c2']);
    expect(registry.isOnline('u1')).toBe(false);
    expect(registry.getJoinedConversations('u1')).toEqual([]);
  });
});
