import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_messages_usecase.dart';
import '../../../domain/usecases/send_message_usecase.dart';
import '../../../domain/usecases/send_image_usecase.dart';
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
  final SendImageUseCase _sendImageUseCase;
  final ListenToMessagesUseCase _listenToMessagesUseCase;
  final IChatRepository _chatRepository;

  StreamSubscription? _messageSubscription;
  StreamSubscription? _typingSubscription;

  ChatDetailBloc(
    this._getMessagesUseCase,
    this._sendMessageUseCase,
    this._sendImageUseCase,
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

        // Start listening to typing events
        _typingSubscription = _chatRepository.listenToTyping().listen((event) {
          // Only handle typing events for this conversation
          if (event.conversationId == state.conversationId) {
            if (event.isTyping) {
              add(
                ChatDetailEvent.userTypingReceived(
                  userId: event.userId,
                  userName: event.userName,
                ),
              );
            } else {
              add(ChatDetailEvent.userStoppedTyping(userId: event.userId));
            }
          }
        });
      },
      leaveConversation: (e) async {
        await _messageSubscription?.cancel();
        await _typingSubscription?.cancel();
        await _chatRepository.leaveConversation(state.conversationId);
      },
      sendImage: (e) async {
        emit(state.copyWith(isSending: true));

        final result = await _sendImageUseCase(
          SendImageParams(conversationId: state.conversationId, file: e.image),
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
      startTyping: (e) async {
        // Emit typing event to WebSocket
        await _chatRepository.emitTyping(state.conversationId);
      },
      stopTyping: (e) async {
        // Note: Backend expects typing event with isTyping flag or timeout
        // For now, we'll rely on backend timeout to clear typing status
      },
      userTypingReceived: (e) async {
        // Add user to typing list if not already present
        if (!state.typingUserIds.contains(e.userId)) {
          final updatedIds = [...state.typingUserIds, e.userId];
          final updatedUsers = Map<String, String>.from(state.typingUsers);
          updatedUsers[e.userId] = e.userName;
          emit(
            state.copyWith(
              typingUserIds: updatedIds,
              typingUsers: updatedUsers,
            ),
          );
        }
      },
      userStoppedTyping: (e) async {
        // Remove user from typing list
        if (state.typingUserIds.contains(e.userId)) {
          final updatedIds = state.typingUserIds
              .where((id) => id != e.userId)
              .toList();
          final updatedUsers = Map<String, String>.from(state.typingUsers);
          updatedUsers.remove(e.userId);
          emit(
            state.copyWith(
              typingUserIds: updatedIds,
              typingUsers: updatedUsers,
            ),
          );
        }
      },
    );
  }

  @override
  Future<void> close() {
    _messageSubscription?.cancel();
    _typingSubscription?.cancel();
    _chatRepository.leaveConversation(state.conversationId);
    return super.close();
  }
}
