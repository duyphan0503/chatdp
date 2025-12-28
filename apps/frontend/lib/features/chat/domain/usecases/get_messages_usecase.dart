import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';

/// UseCase for fetching messages in a conversation with pagination.
///
/// This encapsulates the business logic for retrieving message history,
/// supporting infinite scroll with cursor-based pagination.
@injectable
class GetMessagesUseCase {
  final IChatRepository _repository;

  const GetMessagesUseCase(this._repository);

  /// Execute the use case
  ///
  /// [conversationId] - ID of the conversation
  /// [cursor] - Cursor for pagination (optional, for loading more)
  /// [limit] - Number of messages to fetch
  ///
  /// Returns Either<Failure, List<Message>>
  Future<Either<Failure, List<Message>>> call({
    required String conversationId,
    String? cursor,
    int limit = 20,
  }) {
    return _repository.getMessages(
      conversationId: conversationId,
      cursor: cursor,
      limit: limit,
    );
  }
}
