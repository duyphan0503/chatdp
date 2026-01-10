part of 'create_conversation_cubit.dart';

sealed class CreateConversationState extends Equatable {
  const CreateConversationState();
  @override
  List<Object> get props => [];
}

final class CreateConversationInitial extends CreateConversationState {}

final class CreateConversationLoading extends CreateConversationState {}

final class CreateConversationSuccess extends CreateConversationState {
  final Conversation conversation;

  const CreateConversationSuccess(this.conversation);

  @override
  List<Object> get props => [conversation];
}

final class CreateConversationError extends CreateConversationState {
  final String message;

  const CreateConversationError(this.message);

  @override
  List<Object> get props => [message];
}
