import 'package:freezed_annotation/freezed_annotation.dart';

part 'message.freezed.dart';

/// Message entity representing a chat message.
///
/// This is the core business object for messages, immutable and
/// independent of any data source implementation.
@freezed
abstract class Message with _$Message {
  const factory Message({
    required String id,
    required String conversationId,
    required String senderId,
    required String senderName,
    String? senderAvatarUrl,
    required MessageContentType contentType,
    required String content,
    String? mediaUrl,
    required DateTime createdAt,

    /// Whether this message was sent by the current user
    required bool isMine,

    /// Message status (for messages sent by current user)
    MessageStatus? status,
  }) = _Message;
}

/// Type of message content
enum MessageContentType { text, image, video, file, voice }

/// Status of message delivery/read
enum MessageStatus { sending, sent, delivered, read, failed }
