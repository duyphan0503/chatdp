import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../domain/entities/conversation.dart';
import '../../../domain/usecases/create_conversation_usecase.dart';

part 'create_conversation_state.dart';

@injectable
class CreateConversationCubit extends Cubit<CreateConversationState> {
  final CreateConversationUseCase _createConversationUseCase;

  CreateConversationCubit(this._createConversationUseCase)
    : super(CreateConversationInitial());

  Future<void> createChat(String userId) async {
    emit(CreateConversationLoading());
    final result = await _createConversationUseCase(userId);
    result.fold(
      (failure) => emit(CreateConversationError(failure.message)),
      (conversation) => emit(CreateConversationSuccess(conversation)),
    );
  }
}
