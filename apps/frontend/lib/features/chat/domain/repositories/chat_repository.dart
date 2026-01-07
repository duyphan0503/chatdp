import 'dart:io';
import 'package:fpdart/fpdart.dart';
import '../entities/conversation.dart';
import '../entities/message.dart';
import '../../../../core/error/failures.dart';

/// Repository interface for chat operations.
///
/// This defines the contract for chat data operations without
/// specifying implementation details. The data layer will provide
/// concrete implementations.
abstract class IChatRepository {
  /// Get list of conversations for the current user
  ///
  /// Returns Either<Failure, List\<Conversation\>>
  /// - Left: Failure if operation failed
  /// - Right: List of conversations if successful
  Future<Either<Failure, List<Conversation>>> getConversations();

  /// Get messages for a specific conversation with pagination
  ///
  /// [conversationId] - ID of the conversation
  /// [cursor] - Cursor for pagination (message ID or timestamp)
  /// [limit] - Number of messages to fetch (default: 20)
  ///
  /// Returns Either<Failure, List\<Message\>>
  Future<Either<Failure, List<Message>>> getMessages({
    required String conversationId,
    String? cursor,
    int limit = 20,
  });

  /// Send a text message to a conversation
  ///
  /// [conversationId] - ID of the conversation
  /// [content] - Message content
  ///
  /// Returns Either<Failure, Message\> - The sent message
  Future<Either<Failure, Message>> sendMessage({
    required String conversationId,
    required String content,
  });

  /// Send an image message
  Future<Either<Failure, Message>> sendImage({
    required String conversationId,
    required File file,
  });

  /// Listen to new messages in real-time via WebSocket
  ///
  /// Returns a Stream of Either<Failure, Message>
  /// - Emits Left(Failure) on WebSocket errors
  /// - Emits Right(Message) when new message arrives
  Stream<Either<Failure, Message>> listenToMessages();

  /// Join a conversation room (WebSocket)
  ///
  /// [conversationId] - ID of the conversation to join
  Future<Either<Failure, void>> joinConversation(String conversationId);

  /// Leave a conversation room (WebSocket)
  ///
  /// [conversationId] - ID of the conversation to leave
  Future<Either<Failure, void>> leaveConversation(String conversationId);

  /// Connect to WebSocket with authentication
  Future<Either<Failure, void>> connectWebSocket();

  /// Disconnect from WebSocket
  Future<void> disconnectWebSocket();

  /// Get WebSocket connection state stream
  Stream<WebSocketState> get connectionState;

  /// Emit typing event to a conversation
  ///
  /// [conversationId] - ID of the conversation
  Future<Either<Failure, void>> emitTyping(String conversationId);

  /// Listen to typing events in real-time via WebSocket
  ///
  /// Returns a Stream of typing events with userId and userName
  Stream<TypingEvent> listenToTyping();
}

/// WebSocket connection state
enum WebSocketState { disconnected, connecting, connected, error }

/// Typing event from WebSocket
class TypingEvent {
  final String conversationId;
  final String userId;
  final String userName;
  final bool isTyping;

  TypingEvent({
    required this.conversationId,
    required this.userId,
    required this.userName,
    required this.isTyping,
  });
}
