import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';

/// UseCase for listening to real-time messages via WebSocket.
///
/// This provides a stream of incoming messages, handling WebSocket
/// connection and message events.
@injectable
class ListenToMessagesUseCase {
  final IChatRepository _repository;

  const ListenToMessagesUseCase(this._repository);

  /// Execute the use case
  ///
  /// Returns `Stream<Either<Failure, Message>>`
  /// - Emits Left(Failure) on errors
  /// - Emits Right(Message) for each new message
  Stream<Either<Failure, Message>> call() {
    return _repository.listenToMessages();
  }
}
