import 'package:equatable/equatable.dart';

/// Base class for all failures in the application.
///
/// Failures represent errors in the domain layer, abstracting away
/// implementation details of exceptions from data sources.
abstract class Failure extends Equatable {
  final String message;

  const Failure(this.message);

  @override
  List<Object?> get props => [message];
}

/// Server-side error (4xx, 5xx responses)
class ServerFailure extends Failure {
  const ServerFailure([super.message = 'Server error occurred']);
}

/// Network connectivity error
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'No internet connection']);
}

/// WebSocket connection error
class WebSocketFailure extends Failure {
  const WebSocketFailure([super.message = 'WebSocket connection failed']);
}

/// Authentication/Authorization error
class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Authentication failed']);
}

/// Validation error (client-side)
class ValidationFailure extends Failure {
  const ValidationFailure([super.message = 'Validation failed']);
}

/// Cache error (local storage)
class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Cache operation failed']);
}

/// Unknown/Unexpected error
class UnknownFailure extends Failure {
  const UnknownFailure([super.message = 'An unexpected error occurred']);
}
