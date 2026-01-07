import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_messages_usecase.dart';
import '../../../domain/usecases/send_message_usecase.dart';
import '../../../domain/usecases/listen_to_messages_usecase.dart';
import '../../../domain/repositories/chat_repository.dart';
import '../../../domain/entities/message.dart';
import 'chat_detail_event.dart';
import 'chat_detail_state.dart';

/// Bloc for managing chat detail screen.
///
/// Handles message loading, pagination, sending, and real-time updates.
@injectable
class ChatDetailBloc extends Bloc<ChatDetailEvent, ChatDetailState> {
  final GetMessagesUseCase _getMessagesUseCase;
  final SendMessageUseCase _sendMessageUseCase;
  final ListenToMessagesUseCase _listenToMessagesUseCase;
  final IChatRepository _chatRepository;

  StreamSubscription? _messageSubscription;

  ChatDetailBloc(
    this._getMessagesUseCase,
    this._sendMessageUseCase,
    this._listenToMessagesUseCase,
    this._chatRepository,
    @factoryParam String conversationId,
  ) : super(ChatDetailState(conversationId: conversationId)) {
    on<ChatDetailEvent>(_onEvent);

    // Auto-join conversation and start listening to messages
    add(const ChatDetailEvent.joinConversation());
    add(ChatDetailEvent.loadMessages(conversationId: conversationId));
  }

  Future<void> _onEvent(
    ChatDetailEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    await event.map<Future<void>>(
      loadMessages: (e) async {
        emit(state.copyWith(isLoading: true, errorMessage: null));

        final result = await _getMessagesUseCase(
          conversationId: e.conversationId,
          limit: 20,
        );

        result.fold(
          (failure) => emit(
            state.copyWith(isLoading: false, errorMessage: failure.message),
          ),
          (messages) {
            emit(
              state.copyWith(
                isLoading: false,
                messages: messages,
                hasMore: messages.length >= 20,
                cursor: messages.isNotEmpty ? messages.last.id : null,
              ),
            );
          },
        );
      },
      loadMoreMessages: (e) async {
        if (state.isLoadingMore || !state.hasMore) return;

        emit(state.copyWith(isLoadingMore: true));

        final result = await _getMessagesUseCase(
          conversationId: state.conversationId,
          cursor: state.cursor,
          limit: 20,
        );

        result.fold(
          (failure) => emit(
            state.copyWith(isLoadingMore: false, errorMessage: failure.message),
          ),
          (messages) {
            if (messages.isEmpty) {
              emit(state.copyWith(isLoadingMore: false, hasMore: false));
            } else {
              // Append older messages to the end (since list is Newest -> Oldest)
              final updatedMessages = [...state.messages, ...messages];
              emit(
                state.copyWith(
                  isLoadingMore: false,
                  messages: updatedMessages,
                  hasMore: messages.length >= 20,
                  cursor: messages.last.id,
                ),
              );
            }
          },
        );
      },
      sendMessage: (e) async {
        if (e.content.trim().isEmpty) return;

        emit(state.copyWith(isSending: true));

        final result = await _sendMessageUseCase(
          conversationId: state.conversationId,
          content: e.content,
        );

        result.fold(
          (failure) => emit(
            state.copyWith(isSending: false, errorMessage: failure.message),
          ),
          (message) {
            // Add optimistic message to UI
            final updatedMessages = [message, ...state.messages];
            emit(state.copyWith(isSending: false, messages: updatedMessages));
          },
        );
      },
      messageReceived: (e) async {
        final message = e.message;

        // Check if message already exists (avoid duplicates from optimistic updates)
        final existingIndex = state.messages.indexWhere(
          (m) => m.id == message.id,
        );

        if (existingIndex != -1) {
          // Update existing message (e.g., status change from sending to sent)
          final updatedMessages = List.of(state.messages);
          updatedMessages[existingIndex] = message;
          emit(state.copyWith(messages: updatedMessages));
        } else {
          // Add new message
          final updatedMessages = <Message>[message, ...state.messages];
          emit(state.copyWith(messages: updatedMessages));
        }
      },
      joinConversation: (e) async {
        // Join conversation room via WebSocket
        await _chatRepository.joinConversation(state.conversationId);

        // Start listening to incoming messages
        _messageSubscription = _listenToMessagesUseCase().listen((either) {
          either.fold(
            (failure) {
              // TODO: handle WebSocket error properly, e.g.:
              // emit(state.copyWith(errorMessage: failure.message));
            },
            (message) {
              // Only add messages for this conversation
              if (message.conversationId == state.conversationId) {
                add(ChatDetailEvent.messageReceived(message: message));
              }
            },
          );
        });
      },
      leaveConversation: (e) async {
        await _messageSubscription?.cancel();
        await _chatRepository.leaveConversation(state.conversationId);
      },
    );
  }

  @override
  Future<void> close() {
    _messageSubscription?.cancel();
    _chatRepository.leaveConversation(state.conversationId);
    return super.close();
  }
}
