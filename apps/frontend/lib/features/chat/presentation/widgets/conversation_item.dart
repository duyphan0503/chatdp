import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/conversation.dart';

class ConversationItem extends StatelessWidget {
  final Conversation conversation;
  final String currentUserId;

  const ConversationItem({
    super.key,
    required this.conversation,
    required this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ParticipantResult participantResult = _getOtherParticipant();
    final String name = _getName(participantResult);
    final String? avatarUrl = _getAvatarUrl(participantResult);
    final lastMessage = conversation.lastMessageContent ?? '';
    final time = conversation.lastMessageAt != null
        ? _formatDate(conversation.lastMessageAt!)
        : '';

    return ListTile(
      leading: Stack(
        children: [
          if (avatarUrl != null)
            CircleAvatar(
              radius: 28,
              backgroundImage: CachedNetworkImageProvider(avatarUrl),
            )
          else
            CircleAvatar(
              radius: 28,
              child: Text(
                name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?',
                style: theme.textTheme.titleMedium,
              ),
            ),
          // Online status indicator can go here
        ],
      ),
      title: Text(
        name,
        style: theme.textTheme.titleMedium?.copyWith(
          fontWeight: conversation.unreadCount > 0
              ? FontWeight.bold
              : FontWeight.normal,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              lastMessage,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: conversation.unreadCount > 0
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: conversation.unreadCount > 0
                    ? FontWeight.w500
                    : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (time.isNotEmpty)
            Text(
              time,
              style: theme.textTheme.labelSmall?.copyWith(
                color: conversation.unreadCount > 0
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: conversation.unreadCount > 0
                    ? FontWeight.bold
                    : FontWeight.normal,
              ),
            ),
          const SizedBox(height: 6),
          if (conversation.unreadCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                conversation.unreadCount.toString(),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      onTap: () {
        context.pushNamed(
          'chatDetail',
          pathParameters: {'id': conversation.id},
          extra: {'title': name, 'avatarUrl': avatarUrl},
        );
      },
    );
  }

  ParticipantResult _getOtherParticipant() {
    if (conversation.type == ConversationType.group) {
      return ParticipantResult(
        isGroup: true,
        groupName: conversation.groupName,
        groupAvatar: conversation.groupAvatarUrl,
      );
    }

    final other = conversation.participants.firstWhere(
      (p) => p.userId != currentUserId,
      orElse: () => conversation.participants.first,
    );
    return ParticipantResult(isGroup: false, participant: other);
  }

  String _getName(ParticipantResult result) {
    if (result.isGroup) {
      return result.groupName ?? 'Group Chat';
    }
    return result.participant?.displayName ?? 'Unknown';
  }

  String? _getAvatarUrl(ParticipantResult result) {
    if (result.isGroup) {
      return result.groupAvatar;
    }
    return result.participant?.avatarUrl;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return DateFormat('HH:mm').format(date);
    } else if (difference.inDays < 7) {
      return DateFormat('EEE').format(date);
    } else {
      return DateFormat('dd/MM/yy').format(date);
    }
  }
}

class ParticipantResult {
  final bool isGroup;
  final ConversationParticipant? participant;
  final String? groupName;
  final String? groupAvatar;

  ParticipantResult({
    required this.isGroup,
    this.participant,
    this.groupName,
    this.groupAvatar,
  });
}
