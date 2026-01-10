import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/conversation.dart';
import '../repositories/chat_repository.dart';

@injectable
class CreateConversationUseCase {
  final IChatRepository _repository;

  CreateConversationUseCase(this._repository);

  Future<Either<Failure, Conversation>> call(String userId) {
    return _repository.createConversation(userId);
  }
}
