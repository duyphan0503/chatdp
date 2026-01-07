import 'package:freezed_annotation/freezed_annotation.dart';

part 'conversation.freezed.dart';

/// Conversation entity representing a chat conversation (1-1 or group).
///
/// This is the core business object for conversations, immutable and
/// independent of any data source implementation.
@freezed
abstract class Conversation with _$Conversation {
  const factory Conversation({
    required String id,
    required ConversationType type,
    String? groupName,
    String? groupAvatarUrl,
    String? lastMessageContent,
    DateTime? lastMessageAt,
    required int unreadCount,
    required DateTime createdAt,
    required DateTime updatedAt,

    /// Participants in this conversation
    required List<ConversationParticipant> participants,
  }) = _Conversation;
}

/// Type of conversation
enum ConversationType { private, group }

/// Participant in a conversation
@freezed
abstract class ConversationParticipant with _$ConversationParticipant {
  const factory ConversationParticipant({
    required String userId,
    required String displayName,
    String? avatarUrl,
    ParticipantRole? role,
  }) = _ConversationParticipant;
}

/// Role of participant in group chat
enum ParticipantRole { admin, member }
