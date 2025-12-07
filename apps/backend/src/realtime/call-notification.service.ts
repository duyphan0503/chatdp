import { Injectable, Logger } from '@nestjs/common';
import type { CallSession } from './call-state.store.js';
import { PresenceRegistry } from './presence.registry.js';

/**
 * Phase 8 - Abstraction for call-related push notifications.
 *
 * For now this is a stub that only logs when an incoming call targets an
 * offline callee. A concrete FCM/APNS implementation can be plugged in later
 * without changing CallService.
 */
@Injectable()
export class CallNotificationService {
  private readonly logger = new Logger(CallNotificationService.name);

  constructor(private readonly presence: PresenceRegistry) {}

  /**
   * Notify callee about an incoming call when they are offline (no active WS).
   *
   * TODO Phase 8+: integrate FCM/APNS here. The payload should include
   * minimal metadata only (no sensitive content).
   */
  async notifyIncomingCallIfOffline(session: CallSession): Promise<void> {
    const { calleeId, callId, conversationId, type } = session;
    const online = this.presence.isOnline(calleeId);
    if (online) {
      // Active WS connections exist - rely on realtime signaling instead.
      return;
    }

    // Placeholder: structured log only. No external integration yet.
    this.logger.debug(
      `Would send push notification for incoming ${type} call ` +
        `(callId=${callId}, conversationId=${conversationId}, calleeId=${calleeId})`,
    );
  }
}
