import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../entities/conversation.dart';
import '../repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';

/// UseCase for fetching list of conversations.
///
/// This encapsulates the business logic for retrieving conversations,
/// keeping the presentation layer clean and testable.
@injectable
class GetConversationsUseCase {
  final IChatRepository _repository;

  const GetConversationsUseCase(this._repository);

  /// Execute the use case
  ///
  /// Returns Either<Failure, List<Conversation>>
  Future<Either<Failure, List<Conversation>>> call() {
    return _repository.getConversations();
  }
}
