import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

// Phase 8 — Calls Signaling (WebRTC) — skeleton gateway
// Notes:
// - JWT handshake expected via a dedicated 'authenticate' event carrying access token
// - After auth, socket joins rooms keyed by userId and conversationId as needed
// - This gateway only defines message contracts; actual auth/guards and services will be wired in Phase 8
@WebSocketGateway({ namespace: '/ws', cors: { origin: true, credentials: true } })
export class CallsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    // TODO: rate limit connections and verify basic handshake constraints
  }

  // Client -> Server: send JWT to establish an authenticated session
  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() data: { token: string }) {
    // TODO: verify JWT, extract userId, attach to socket.data
    // Example: client.data.userId = decoded.sub
    // Optionally, join user room: client.join(`user:${userId}`)
    client.emit('authenticated', { status: 'ok' });
  }

  // Call signaling events
  @SubscribeMessage('call:initiate')
  handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      calleeUserId: string;
      sdp?: unknown; // offer
    },
  ) {
    // TODO: authZ: ensure caller is participant of conversationId
    // Broadcast to callee room or conversation room
    this.server.to(`user:${payload.calleeUserId}`).emit('call:incoming', {
      conversationId: payload.conversationId,
      fromUserId: client.data?.userId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; peerUserId: string; sdp?: unknown },
  ) {
    this.server.to(`user:${payload.peerUserId}`).emit('call:accepted', {
      conversationId: payload.conversationId,
      fromUserId: client.data?.userId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; peerUserId: string; reason?: string },
  ) {
    this.server.to(`user:${payload.peerUserId}`).emit('call:rejected', {
      conversationId: payload.conversationId,
      fromUserId: client.data?.userId,
      reason: payload.reason ?? 'rejected',
    });
  }

  @SubscribeMessage('call:ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; peerUserId: string; candidate: unknown },
  ) {
    this.server.to(`user:${payload.peerUserId}`).emit('call:ice_candidate', {
      conversationId: payload.conversationId,
      fromUserId: client.data?.userId,
      candidate: payload.candidate,
    });
  }
}
