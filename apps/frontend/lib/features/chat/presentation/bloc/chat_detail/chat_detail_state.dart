import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/message.dart';

part 'chat_detail_state.freezed.dart';

/// State for chat detail screen.
@freezed
abstract class ChatDetailState with _$ChatDetailState {
  const factory ChatDetailState({
    /// Current conversation ID
    required String conversationId,

    /// List of messages (newest at bottom)
    @Default([]) List<Message> messages,

    /// Loading state for initial load
    @Default(false) bool isLoading,

    /// Loading state for pagination
    @Default(false) bool isLoadingMore,

    /// Whether there are more messages to load
    @Default(true) bool hasMore,

    /// Cursor for pagination
    String? cursor,

    /// Error message if any
    String? errorMessage,

    /// Sending state
    @Default(false) bool isSending,

    /// List of users currently typing (user IDs)
    @Default([]) List<String> typingUserIds,

    /// Map of user ID to display name for typing users
    @Default({}) Map<String, String> typingUsers,

    /// Map of user ID to participant info for resolving sender names
    @Default({}) Map<String, ConversationParticipant> participantsMap,
  }) = _ChatDetailState;
}
