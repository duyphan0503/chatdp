import 'dart:io';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/constants/error_keys.dart';

/// Parameters for sending an image message.
class SendImageParams {
  /// ID of the conversation to send the image to
  final String conversationId;

  /// Image file to send
  final File file;

  const SendImageParams({required this.conversationId, required this.file});
}

/// UseCase for sending an image message.
///
/// This encapsulates the business logic for sending image messages,
/// including validation and error handling.
@injectable
class SendImageUseCase {
  final IChatRepository _repository;

  const SendImageUseCase(this._repository);

  /// Execute the use case
  ///
  /// [params] - Parameters containing conversation ID and image file
  ///
  /// Returns `Either<Failure, Message>` - The sent message
  Future<Either<Failure, Message>> call(SendImageParams params) {
    // Validate conversation ID
    final trimmedConversationId = params.conversationId.trim();
    if (trimmedConversationId.isEmpty) {
      return Future.value(const Left(ValidationFailure(ErrorKeys.convIdEmpty)));
    }

    // Validate file exists
    if (!params.file.existsSync()) {
      return Future.value(
        const Left(ValidationFailure(ErrorKeys.imageFileNotExist)),
      );
    }

    // Validate file is an image (basic extension check)
    final fileName = params.file.path.toLowerCase();
    final validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    final hasValidExtension = validExtensions.any(
      (ext) => fileName.endsWith(ext),
    );

    if (!hasValidExtension) {
      return Future.value(
        const Left(ValidationFailure(ErrorKeys.invalidImageFormat)),
      );
    }

    return _repository.sendImage(
      conversationId: trimmedConversationId,
      file: params.file,
    );
  }
}
