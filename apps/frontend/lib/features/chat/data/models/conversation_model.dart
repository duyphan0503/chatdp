import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/conversation.dart';

part 'conversation_model.freezed.dart';
part 'conversation_model.g.dart';

/// Data Transfer Object for Conversation.
///
/// This model handles JSON serialization/deserialization from the API.
/// It can be converted to/from the domain Conversation entity.
@freezed
abstract class ConversationModel with _$ConversationModel {
  const factory ConversationModel({
    required String id,
    required String type,
    String? groupName,
    String? groupAvatarUrl,
    String? lastMessageContent,
    DateTime? lastMessageAt,
    @Default(0) int unreadCount,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default([]) List<ParticipantModel> participants,
  }) = _ConversationModel;

  factory ConversationModel.fromJson(Map<String, dynamic> json) =>
      _$ConversationModelFromJson(json);
}

/// Extension methods for ConversationModel
extension ConversationModelX on ConversationModel {
  /// Convert DTO to domain entity
  Conversation toEntity() {
    return Conversation(
      id: id,
      type: _parseConversationType(type),
      groupName: groupName,
      groupAvatarUrl: groupAvatarUrl,
      lastMessageContent: lastMessageContent,
      lastMessageAt: lastMessageAt,
      unreadCount: unreadCount,
      createdAt: createdAt,
      updatedAt: updatedAt,
      participants: participants.map((p) => p.toEntity()).toList(),
    );
  }

  static ConversationType _parseConversationType(String type) {
    switch (type.toLowerCase()) {
      case 'private':
        return ConversationType.private;
      case 'group':
        return ConversationType.group;
      default:
        return ConversationType.private;
    }
  }
}

/// Convert domain entity to DTO (top-level function)
ConversationModel conversationToModel(Conversation entity) {
  return ConversationModel(
    id: entity.id,
    type: entity.type.name,
    groupName: entity.groupName,
    groupAvatarUrl: entity.groupAvatarUrl,
    lastMessageContent: entity.lastMessageContent,
    lastMessageAt: entity.lastMessageAt,
    unreadCount: entity.unreadCount,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    participants: entity.participants
        .map((p) => participantToModel(p))
        .toList(),
  );
}

@freezed
abstract class ParticipantModel with _$ParticipantModel {
  const factory ParticipantModel({
    required String userId,
    required String displayName,
    String? avatarUrl,
    String? role,
  }) = _ParticipantModel;

  factory ParticipantModel.fromJson(Map<String, dynamic> json) =>
      _$ParticipantModelFromJson(json);
}

/// Extension methods for ParticipantModel
extension ParticipantModelX on ParticipantModel {
  ConversationParticipant toEntity() {
    return ConversationParticipant(
      userId: userId,
      displayName: displayName,
      avatarUrl: avatarUrl,
      role: _parseRole(role),
    );
  }

  static ParticipantRole? _parseRole(String? role) {
    if (role == null) return null;
    switch (role.toLowerCase()) {
      case 'admin':
        return ParticipantRole.admin;
      case 'member':
        return ParticipantRole.member;
      default:
        return null;
    }
  }
}

/// Convert domain entity to DTO (top-level function)
ParticipantModel participantToModel(ConversationParticipant entity) {
  return ParticipantModel(
    userId: entity.userId,
    displayName: entity.displayName,
    avatarUrl: entity.avatarUrl,
    role: entity.role?.name,
  );
}
