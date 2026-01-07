import 'package:freezed_annotation/freezed_annotation.dart';
import 'dart:io';
import '../../../domain/entities/message.dart';

part 'chat_detail_event.freezed.dart';

/// Events for chat detail screen.
@freezed
class ChatDetailEvent with _$ChatDetailEvent {
  /// Load initial messages for a conversation
  const factory ChatDetailEvent.loadMessages({required String conversationId}) =
      _LoadMessages;

  /// Load more messages (pagination)
  const factory ChatDetailEvent.loadMoreMessages() = _LoadMoreMessages;

  /// Send a text message
  const factory ChatDetailEvent.sendMessage({required String content}) =
      _SendMessage;

  /// New message received via WebSocket
  const factory ChatDetailEvent.messageReceived({required Message message}) =
      _MessageReceived;

  /// Join conversation room (WebSocket)
  const factory ChatDetailEvent.joinConversation() = _JoinConversation;

  /// Leave conversation room (WebSocket)
  const factory ChatDetailEvent.leaveConversation() = _LeaveConversation;

  /// Send an image message
  const factory ChatDetailEvent.sendImage({required File image}) = _SendImage;

  /// User started typing
  const factory ChatDetailEvent.startTyping() = _StartTyping;

  /// User stopped typing
  const factory ChatDetailEvent.stopTyping() = _StopTyping;

  /// Another user started typing
  const factory ChatDetailEvent.userTypingReceived({
    required String userId,
    required String userName,
  }) = _UserTypingReceived;

  /// Another user stopped typing
  const factory ChatDetailEvent.userStoppedTyping({required String userId}) =
      _UserStoppedTyping;
}
