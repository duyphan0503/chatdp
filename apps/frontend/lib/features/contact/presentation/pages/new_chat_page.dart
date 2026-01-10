import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../chat/presentation/bloc/create_conversation/create_conversation_cubit.dart';
import '../../../chat/presentation/bloc/conversation_list/conversation_list_cubit.dart';
import '../bloc/contact_search_bloc.dart';

class NewChatPage extends StatelessWidget {
  const NewChatPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => GetIt.I<ContactSearchBloc>()),
        BlocProvider(create: (_) => GetIt.I<CreateConversationCubit>()),
      ],
      child: const _NewChatView(),
    );
  }
}

class _NewChatView extends StatefulWidget {
  const _NewChatView();

  @override
  State<_NewChatView> createState() => _NewChatViewState();
}

class _NewChatViewState extends State<_NewChatView> {
  final _searchController = TextEditingController();
  String? _selectedDisplayName;
  String? _selectedAvatarUrl;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    context.read<ContactSearchBloc>().add(ContactSearchQueryChanged(query));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocListener<CreateConversationCubit, CreateConversationState>(
      listener: (context, state) {
        if (state is CreateConversationSuccess) {
          // Refresh conversation list so it's ready when we go back
          GetIt.I<ConversationListCubit>().refreshConversations();

          context.pushReplacementNamed(
            'chatDetail',
            pathParameters: {'id': state.conversation.id},
            extra: {
              'title':
                  state.conversation.groupName ??
                  _selectedDisplayName ??
                  'Chat',
              'avatarUrl':
                  state.conversation.groupAvatarUrl ?? _selectedAvatarUrl,
              'participants': state.conversation.participants,
            },
          );
        } else if (state is CreateConversationError) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message)));
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text(l10n.newChat)),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  labelText: l10n.search,
                  hintText: l10n.startTypingToSearch,
                  prefixIcon: const Icon(Icons.search),
                  border: const OutlineInputBorder(),
                  filled: true,
                ),
                onChanged: _onSearchChanged,
              ),
            ),
            Expanded(
              child: BlocBuilder<ContactSearchBloc, ContactSearchState>(
                builder: (context, state) {
                  if (state is ContactSearchLoading) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (state is ContactSearchError) {
                    return Center(child: Text(state.message));
                  } else if (state is ContactSearchSuccess) {
                    if (state.users.isEmpty) {
                      return Center(child: Text(l10n.noResults));
                    }
                    return ListView.separated(
                      itemCount: state.users.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final user = state.users[index];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundImage: user.avatarUrl != null
                                ? CachedNetworkImageProvider(user.avatarUrl!)
                                : null,
                            child: user.avatarUrl == null
                                ? Text(
                                    user.displayName.isNotEmpty
                                        ? user.displayName[0].toUpperCase()
                                        : '?',
                                  )
                                : null,
                          ),
                          title: Text(user.displayName),
                          subtitle: user.email != null
                              ? Text(user.email!)
                              : null,
                          onTap: () {
                            setState(() {
                              _selectedDisplayName = user.displayName;
                              _selectedAvatarUrl = user.avatarUrl;
                            });
                            context.read<CreateConversationCubit>().createChat(
                              user.id,
                            );
                          },
                        );
                      },
                    );
                  }
                  return Center(child: Text(l10n.startTypingToSearch));
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
