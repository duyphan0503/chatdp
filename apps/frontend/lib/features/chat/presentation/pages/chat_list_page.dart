import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:get_it/get_it.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../bloc/conversation_list/conversation_list_cubit.dart';
import '../bloc/conversation_list/conversation_list_state.dart';
import '../widgets/conversation_item.dart';

class ChatListPage extends StatelessWidget {
  const ChatListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return BlocProvider(
      create: (_) => GetIt.I<ConversationListCubit>()..loadConversations(),
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.chatListTitle),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_comment_outlined),
              onPressed: () {
                context.pushNamed('newChat');
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
                    onRefresh: () => context
                        .read<ConversationListCubit>()
                        .refreshConversations(),
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
                          onPressed: () => context
                              .read<ConversationListCubit>()
                              .loadConversations(),
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
}
