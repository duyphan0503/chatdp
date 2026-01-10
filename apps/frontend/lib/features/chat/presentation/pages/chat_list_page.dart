import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:get_it/get_it.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../bloc/conversation_list/conversation_list_cubit.dart';
import '../bloc/conversation_list/conversation_list_state.dart';
import '../widgets/conversation_item.dart';
import '../../domain/entities/conversation.dart';

class ChatListPage extends StatefulWidget {
  const ChatListPage({super.key});

  @override
  State<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends State<ChatListPage> {
  late final ConversationListCubit _cubit;

  @override
  void initState() {
    super.initState();
    _cubit = GetIt.I<ConversationListCubit>()..loadConversations();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return BlocProvider.value(
      value: _cubit,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.chatListTitle),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_comment_outlined),
              onPressed: () async {
                // Navigate and refresh when returning
                await context.pushNamed('newChat');
                // Refresh conversations when returning from new chat
                _cubit.refreshConversations();
              },
            ),
          ],
        ),
        body: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, authState) {
            final currentUserId = authState is Authenticated
                ? authState.user.id
                : null;

            if (currentUserId == null) {
              return const Center(child: CircularProgressIndicator());
            }

            return BlocBuilder<ConversationListCubit, ConversationListState>(
              builder: (context, state) {
                return state.when(
                  initial: () => const SizedBox.shrink(),
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  success: (conversations) => RefreshIndicator(
                    onRefresh: () => _cubit.refreshConversations(),
                    child: conversations.isEmpty
                        ? Center(
                            child: Text(
                              l10n.noMessagesYet,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            itemCount: conversations.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1, indent: 72),
                            itemBuilder: (context, index) {
                              return ConversationItem(
                                conversation: conversations[index],
                                currentUserId: currentUserId,
                                onTap: () async {
                                  final conversation = conversations[index];
                                  final participantResult =
                                      _getOtherParticipant(
                                        conversation,
                                        currentUserId,
                                      );
                                  final name = _getName(
                                    participantResult,
                                    conversation,
                                  );
                                  final avatarUrl = _getAvatarUrl(
                                    participantResult,
                                    conversation,
                                  );

                                  await context.pushNamed(
                                    'chatDetail',
                                    pathParameters: {'id': conversation.id},
                                    extra: {
                                      'title': name,
                                      'avatarUrl': avatarUrl,
                                      'participants': conversation.participants,
                                    },
                                  );
                                  // Refresh when returning from chat detail
                                  _cubit.refreshConversations();
                                },
                              );
                            },
                          ),
                  ),
                  error: (message) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          message,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.error,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => _cubit.loadConversations(),
                          child: Text(l10n.retry),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  _ParticipantResult _getOtherParticipant(
    Conversation conversation,
    String currentUserId,
  ) {
    if (conversation.type == ConversationType.group) {
      return _ParticipantResult(
        isGroup: true,
        groupName: conversation.groupName,
        groupAvatar: conversation.groupAvatarUrl,
      );
    }

    if (conversation.participants.isEmpty) {
      return _ParticipantResult(isGroup: false, participant: null);
    }

    try {
      final other = conversation.participants.firstWhere(
        (p) => p.userId != currentUserId,
        orElse: () => conversation.participants.first,
      );
      return _ParticipantResult(isGroup: false, participant: other);
    } catch (_) {
      return _ParticipantResult(isGroup: false, participant: null);
    }
  }

  String _getName(_ParticipantResult result, Conversation conversation) {
    if (result.isGroup) {
      return result.groupName ?? 'Group Chat';
    }
    return result.participant?.displayName ?? 'Unknown';
  }

  String? _getAvatarUrl(_ParticipantResult result, Conversation conversation) {
    if (result.isGroup) {
      return result.groupAvatar;
    }
    return result.participant?.avatarUrl;
  }
}

class _ParticipantResult {
  final bool isGroup;
  final ConversationParticipant? participant;
  final String? groupName;
  final String? groupAvatar;

  _ParticipantResult({
    required this.isGroup,
    this.participant,
    this.groupName,
    this.groupAvatar,
  });
}
