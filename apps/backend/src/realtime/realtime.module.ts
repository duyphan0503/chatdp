import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagingGateway } from './messaging.gateway.js';
import { PresenceRegistry } from './presence.registry.js';
import { CallsGateway } from './calls.gateway.js';
import { CallService } from './call.service.js';
import { CallStateStore } from './call-state.store.js';
import { CallNotificationService } from './call-notification.service.js';

/**
 * Realtime module wiring WebSocket gateways and supporting services.
 *
 * Responsibilities:
 * - MessagingGateway: chat message events and presence updates over WebSocket.
 * - PresenceRegistry: in-memory tracking of online users and active connections.
 * - CallsGateway/CallService: signaling layer for voice/video calls (WebRTC).
 * - CallStateStore/CallNotificationService: manage call lifecycle and notifications.
 *
 * Transport adapters (e.g. Redis for scaling out gateways) can be plugged in later
 * without changing the public gateway contracts.
 */
@Module({
  imports: [AuthModule, MessagesModule, PrismaModule],
  providers: [
    MessagingGateway,
    PresenceRegistry,
    CallsGateway,
    CallService,
    CallStateStore,
    CallNotificationService,
  ],
  exports: [MessagingGateway, CallsGateway],
})
export class RealtimeModule {}
