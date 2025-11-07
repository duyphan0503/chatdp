import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { MessagingGateway } from './messaging.gateway.js';
import { PresenceRegistry } from './presence.registry.js';

// Phase 5 — Realtime/WebSocket
// Provides gateway + presence registry. Adapter abstraction left for later (Redis).
@Module({
  imports: [AuthModule, MessagesModule],
  providers: [MessagingGateway, PresenceRegistry],
  exports: [MessagingGateway],
})
export class RealtimeModule {}
