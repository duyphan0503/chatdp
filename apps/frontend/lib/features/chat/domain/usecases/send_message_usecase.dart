import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';

/// UseCase for sending a text message.
///
/// This encapsulates the business logic for sending messages,
/// including validation and error handling.
@injectable
class SendMessageUseCase {
  final IChatRepository _repository;

  const SendMessageUseCase(this._repository);

  /// Execute the use case
  ///
  /// [conversationId] - ID of the conversation
  /// [content] - Message content (must not be empty)
  ///
  /// Returns Either<Failure, Message> - The sent message
  Future<Either<Failure, Message>> call({
    required String conversationId,
    required String content,
  }) {
    // Validate content
    final trimmedContent = content.trim();
    if (trimmedContent.isEmpty) {
      return Future.value(
        const Left(ValidationFailure('Message content cannot be empty')),
      );
    }

    return _repository.sendMessage(
      conversationId: conversationId,
      content: trimmedContent,
    );
  }
}
