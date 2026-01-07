import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import '../bloc/chat_detail/chat_detail_bloc.dart';
import '../bloc/chat_detail/chat_detail_event.dart';
import '../bloc/chat_detail/chat_detail_state.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/chat_input.dart';

class ChatDetailPage extends StatelessWidget {
  final String conversationId;
  final String? title;
  final String? avatarUrl;

  const ChatDetailPage({
    super.key,
    required this.conversationId,
    this.title,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => GetIt.I<ChatDetailBloc>(param1: conversationId),
      child: _ChatDetailView(title: title, avatarUrl: avatarUrl),
    );
  }
}

class _ChatDetailView extends StatefulWidget {
  final String? title;
  final String? avatarUrl;

  const _ChatDetailView({this.title, this.avatarUrl});

  @override
  State<_ChatDetailView> createState() => _ChatDetailViewState();
}

class _ChatDetailViewState extends State<_ChatDetailView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      context.read<ChatDetailBloc>().add(
        const ChatDetailEvent.loadMoreMessages(),
      );
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            if (widget.avatarUrl != null) ...[
              CircleAvatar(
                radius: 20,
                backgroundImage: CachedNetworkImageProvider(widget.avatarUrl!),
              ),
              const SizedBox(width: 10),
            ] else ...[
              CircleAvatar(
                radius: 20,
                child: Text(widget.title?.substring(0, 1).toUpperCase() ?? '?'),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title ?? 'Chat',
                    style: theme.textTheme.titleMedium,
                    overflow: TextOverflow.ellipsis,
                  ),
                  // TODO: Add online status if available
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.call)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.videocam)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.info_outline)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: BlocBuilder<ChatDetailBloc, ChatDetailState>(
              builder: (context, state) {
                if (state.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.messages.isEmpty && !state.isLoading) {
                  return Center(
                    child: Text(
                      'No messages yet',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  reverse: true, // Messages are stored newest first
                  padding: const EdgeInsets.only(top: 16, bottom: 16),
                  itemCount:
                      state.messages.length + (state.isLoadingMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= state.messages.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(8.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    final message = state.messages[index];
                    return ChatBubble(message: message);
                  },
                );
              },
            ),
          ),
          BlocSelector<ChatDetailBloc, ChatDetailState, bool>(
            selector: (state) => state.isSending,
            builder: (context, isSending) {
              return ChatInput(
                isSending: isSending,
                onSend: (content) {
                  context.read<ChatDetailBloc>().add(
                    ChatDetailEvent.sendMessage(content: content),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
