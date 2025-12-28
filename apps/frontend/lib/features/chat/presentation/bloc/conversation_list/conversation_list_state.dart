import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../domain/entities/conversation.dart';

part 'conversation_list_state.freezed.dart';

/// State for conversation list screen.
///
/// Uses freezed for immutability and union types to represent
/// different states clearly.
@freezed
class ConversationListState with _$ConversationListState {
  /// Initial state before any data is loaded
  const factory ConversationListState.initial() = _Initial;

  /// Loading state while fetching conversations
  const factory ConversationListState.loading() = _Loading;

  /// Success state with loaded conversations
  const factory ConversationListState.success({
    required List<Conversation> conversations,
  }) = _Success;

  /// Error state with failure message
  const factory ConversationListState.error({required String message}) = _Error;
}
