import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/message.dart';
import 'package:intl/intl.dart';
import '../../../../l10n/app_localizations.dart';

class ChatBubble extends StatelessWidget {
  final Message message;
  final Map<String, ConversationParticipant> participantsMap;

  const ChatBubble({
    super.key,
    required this.message,
    this.participantsMap = const {},
  });

  /// Resolve sender name from participantsMap if message.senderName is empty
  String get _resolvedSenderName {
    if (message.senderName.isNotEmpty) {
      return message.senderName;
    }
    final participant = participantsMap[message.senderId];
    return participant?.displayName ?? 'Unknown';
  }

  /// Resolve sender avatar URL from participantsMap if message doesn't have one
  String? get _resolvedAvatarUrl {
    if (message.senderAvatarUrl != null) {
      return message.senderAvatarUrl;
    }
    return participantsMap[message.senderId]?.avatarUrl;
  }

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        mainAxisAlignment: isMine
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine) ...[_buildAvatar(), const SizedBox(width: 8)],
          Flexible(
            child: Column(
              crossAxisAlignment: isMine
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                if (!isMine && (message.receiverNameVisible ?? false))
                  Padding(
                    padding: const EdgeInsets.only(left: 12, bottom: 4),
                    child: Text(
                      _resolvedSenderName,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                Container(
                  decoration: BoxDecoration(
                    color: isMine
                        ? colorScheme.primary
                        : colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isMine ? 20 : 4),
                      bottomRight: Radius.circular(isMine ? 4 : 20),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildMessageContent(context),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              DateFormat('HH:mm').format(message.createdAt),
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: isMine
                                    ? colorScheme.onPrimary.withValues(
                                        alpha: 0.7,
                                      )
                                    : colorScheme.onSurfaceVariant.withValues(
                                        alpha: 0.7,
                                      ),
                                fontSize: 10,
                              ),
                            ),
                            if (isMine) ...[
                              const SizedBox(width: 4),
                              _buildStatusIcon(context),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    final avatarUrl = _resolvedAvatarUrl;
    final senderName = _resolvedSenderName;

    if (avatarUrl != null) {
      return CircleAvatar(
        radius: 16,
        backgroundImage: CachedNetworkImageProvider(avatarUrl),
      );
    }
    return CircleAvatar(
      radius: 16,
      child: Text(
        senderName.isNotEmpty ? senderName.substring(0, 1).toUpperCase() : '?',
      ),
    );
  }

  Widget _buildStatusIcon(BuildContext context) {
    IconData icon;
    Color? color = Theme.of(
      context,
    ).colorScheme.onPrimary.withValues(alpha: 0.7);

    switch (message.status) {
      case MessageStatus.sending:
        icon = Icons.access_time;
        break;
      case MessageStatus.sent:
        icon = Icons.check;
        break;
      case MessageStatus.delivered:
        icon = Icons.done_all;
        break;
      case MessageStatus.read:
        icon = Icons.done_all;
        // Ideally distinct color for read, but using onPrimary for contrast on primary bg
        break;
      case MessageStatus.failed:
        icon = Icons.error_outline;
        color = Theme.of(context).colorScheme.error;
        break;
      case null:
        icon = Icons.access_time;
    }

    return Icon(icon, size: 12, color: color);
  }

  Widget _buildMessageContent(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isMine = message.isMine;

    switch (message.contentType) {
      case MessageContentType.image:
        if (message.mediaUrl != null) {
          return ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
            child: CachedNetworkImage(
              imageUrl: message.mediaUrl!,
              placeholder: (context, url) => Container(
                width: 200,
                height: 200,
                color: isMine
                    ? colorScheme.primary.withValues(alpha: 0.3)
                    : colorScheme.surfaceContainerHighest.withValues(
                        alpha: 0.5,
                      ),
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: isMine
                        ? colorScheme.onPrimary.withValues(alpha: 0.7)
                        : colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                  ),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                width: 200,
                height: 200,
                color: isMine
                    ? colorScheme.error.withValues(alpha: 0.2)
                    : colorScheme.errorContainer,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.broken_image,
                        size: 40,
                        color: isMine
                            ? colorScheme.onPrimary.withValues(alpha: 0.7)
                            : colorScheme.onErrorContainer,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.failedToLoadImage,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isMine
                              ? colorScheme.onPrimary.withValues(alpha: 0.7)
                              : colorScheme.onErrorContainer,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              width: 200,
              height: 200,
              fit: BoxFit.cover,
            ),
          );
        } else {
          // Fallback for image message without URL
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              AppLocalizations.of(context)!.imageUnavailable,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isMine
                    ? colorScheme.onPrimary
                    : colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          );
        }
      case MessageContentType.text:
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Text(
            message.content,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isMine
                  ? colorScheme.onPrimary
                  : colorScheme.onSurfaceVariant,
            ),
          ),
        );
      case MessageContentType.video:
      case MessageContentType.file:
      case MessageContentType.voice:
        // Placeholder for other message types
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _getContentTypeIcon(message.contentType),
                size: 20,
                color: isMine
                    ? colorScheme.onPrimary.withValues(alpha: 0.8)
                    : colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  message.content.isNotEmpty
                      ? message.content
                      : AppLocalizations.of(context)!.unsupportedMessageType,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isMine
                        ? colorScheme.onPrimary
                        : colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
        );
    }
  }

  IconData _getContentTypeIcon(MessageContentType type) {
    switch (type) {
      case MessageContentType.video:
        return Icons.video_file;
      case MessageContentType.file:
        return Icons.attach_file;
      case MessageContentType.voice:
        return Icons.mic;
      case MessageContentType.image:
        return Icons.image;
      case MessageContentType.text:
        return Icons.text_fields;
    }
  }
}

// Temporary extension helper until entity is updated or if needed logic exists elsewhere
extension MessageExt on Message {
  bool? get receiverNameVisible => true; // simplified for now
}
