import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_conversations_usecase.dart';
import 'conversation_list_state.dart';

/// Cubit for managing conversation list state.
///
/// Handles fetching conversations and managing UI state.
@lazySingleton
class ConversationListCubit extends Cubit<ConversationListState> {
  final GetConversationsUseCase _getConversationsUseCase;

  ConversationListCubit(this._getConversationsUseCase)
    : super(const ConversationListState.initial());

  /// Load conversations from repository
  Future<void> loadConversations() async {
    emit(const ConversationListState.loading());

    final result = await _getConversationsUseCase();

    result.fold(
      (failure) => emit(ConversationListState.error(message: failure.message)),
      (conversations) =>
          emit(ConversationListState.success(conversations: conversations)),
    );
  }

  /// Refresh conversations (pull-to-refresh)
  Future<void> refreshConversations() async {
    // Don't show loading state for refresh to avoid UI flicker
    final result = await _getConversationsUseCase();

    result.fold(
      (failure) => emit(ConversationListState.error(message: failure.message)),
      (conversations) =>
          emit(ConversationListState.success(conversations: conversations)),
    );
  }
}
