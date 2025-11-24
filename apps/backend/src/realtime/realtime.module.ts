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

// Phase 5  Realtime/WebSocket
// Provides messaging gateway + presence registry. Adapter abstraction left for later (Redis).
// Phase 8  Calls signaling (WebRTC) adds CallsGateway + CallService on top.
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
