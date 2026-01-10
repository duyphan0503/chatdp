import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/message.dart';

part 'message_model.freezed.dart';
part 'message_model.g.dart';

/// Data Transfer Object for Message.
///
/// This model handles JSON serialization/deserialization from the API/WebSocket.
/// It can be converted to/from the domain Message entity.
@freezed
abstract class MessageModel with _$MessageModel {
  const factory MessageModel({
    required String id,
    required String conversationId,
    required String senderId,
    @Default('') String senderName,
    String? senderAvatarUrl,
    required String contentType,
    required String content,
    String? mediaUrl,
    required DateTime createdAt,
    String? replyToMessageId,
    DateTime? deletedAt,
  }) = _MessageModel;

  factory MessageModel.fromJson(Map<String, dynamic> json) =>
      _$MessageModelFromJson(json);
}

/// Extension methods for MessageModel
extension MessageModelX on MessageModel {
  /// Convert DTO to domain entity
  ///
  /// [currentUserId] - ID of the current user to determine isMine flag
  Message toEntity(String currentUserId) {
    return Message(
      id: id,
      conversationId: conversationId,
      senderId: senderId,
      senderName: senderName,
      senderAvatarUrl: senderAvatarUrl,
      contentType: _parseContentType(contentType),
      content: content,
      mediaUrl: mediaUrl,
      createdAt: createdAt,
      isMine: senderId == currentUserId,
      status: senderId == currentUserId ? MessageStatus.sent : null,
    );
  }

  static MessageContentType _parseContentType(String type) {
    switch (type.toLowerCase()) {
      case 'text':
        return MessageContentType.text;
      case 'image':
        return MessageContentType.image;
      case 'video':
        return MessageContentType.video;
      case 'file':
        return MessageContentType.file;
      case 'voice':
        return MessageContentType.voice;
      default:
        return MessageContentType.text;
    }
  }
}

/// Convert domain entity to DTO (top-level function)
MessageModel messageToModel(Message entity) {
  return MessageModel(
    id: entity.id,
    conversationId: entity.conversationId,
    senderId: entity.senderId,
    senderName: entity.senderName,
    senderAvatarUrl: entity.senderAvatarUrl,
    contentType: entity.contentType.name,
    content: entity.content,
    mediaUrl: entity.mediaUrl,
    createdAt: entity.createdAt,
  );
}
