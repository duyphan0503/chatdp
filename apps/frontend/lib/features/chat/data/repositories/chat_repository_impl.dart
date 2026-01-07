import 'dart:io';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/message.dart';
import '../../domain/repositories/chat_repository.dart';
import '../../../../core/error/failures.dart';
import '../datasources/chat_remote_data_source.dart';
import '../datasources/chat_websocket_data_source.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../../../../core/constants/error_keys.dart';

/// Implementation of IChatRepository.
///
/// This bridges the data layer (data sources) with the domain layer,
/// handling error mapping and data transformation.
@LazySingleton(as: IChatRepository)
class ChatRepositoryImpl implements IChatRepository {
  final IChatRemoteDataSource _remoteDataSource;
  final IChatWebSocketDataSource _webSocketDataSource;
  final FlutterSecureStorage _storage;

  ChatRepositoryImpl(
    this._remoteDataSource,
    this._webSocketDataSource,
    this._storage,
  );

  @override
  Future<Either<Failure, List<Conversation>>> getConversations() async {
    try {
      final models = await _remoteDataSource.getConversations();
      final entities = models.map((model) => model.toEntity()).toList();
      return Right(entities);
    } on DioException catch (e) {
      return Left(_handleDioException(e));
    } catch (e) {
      return Left(UnknownFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Message>>> getMessages({
    required String conversationId,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final models = await _remoteDataSource.getMessages(
        conversationId: conversationId,
        cursor: cursor,
        limit: limit,
      );

      // Get current user ID to determine isMine flag
      final currentUserId = await _getCurrentUserId();

      final entities = models
          .map((model) => model.toEntity(currentUserId))
          .toList();

      return Right(entities);
    } on DioException catch (e) {
      return Left(_handleDioException(e));
    } catch (e) {
      return Left(UnknownFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Message>> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    try {
      // Use WebSocket to send message (will be optimistic)
      // The actual confirmation will come through the message stream
      await _webSocketDataSource.sendMessage(
        conversationId: conversationId,
        content: content,
      );

      // Create optimistic message for immediate UI feedback
      final currentUserId = await _getCurrentUserId();
      final currentUser = await _getCurrentUser();

      final optimisticMessage = Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        conversationId: conversationId,
        senderId: currentUserId,
        senderName: currentUser['displayName'] ?? 'You',
        senderAvatarUrl: currentUser['avatarUrl'],
        contentType: MessageContentType.text,
        content: content,
        createdAt: DateTime.now(),
        isMine: true,
        status: MessageStatus.sending,
      );

      return Right(optimisticMessage);
    } catch (e) {
      // If WebSocket fails, try REST API as fallback
      try {
        final model = await _remoteDataSource.sendMessage(
          conversationId: conversationId,
          content: content,
        );

        final currentUserId = await _getCurrentUserId();
        final entity = model.toEntity(currentUserId);

        return Right(entity);
      } on DioException catch (e) {
        return Left(_handleDioException(e));
      } catch (e) {
        return Left(UnknownFailure(e.toString()));
      }
    }
  }

  @override
  Future<Either<Failure, Message>> sendImage({
    required String conversationId,
    required File file,
  }) async {
    try {
      // 1. Upload file first
      final imageUrl = await _remoteDataSource.uploadFile(file);

      // 2. Send message with image URL
      // Use WebSocket to send message (will be optimistic)
      await _webSocketDataSource.sendMessage(
        conversationId: conversationId,
        content: imageUrl,
        contentType: 'image',
      );

      // Create optimistic message for immediate UI feedback
      final currentUserId = await _getCurrentUserId();
      final currentUser = await _getCurrentUser();

      final optimisticMessage = Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        conversationId: conversationId,
        senderId: currentUserId,
        senderName: currentUser['displayName'] ?? 'You',
        senderAvatarUrl: currentUser['avatarUrl'],
        contentType: MessageContentType.image,
        content: imageUrl,
        createdAt: DateTime.now(),
        isMine: true,
        status: MessageStatus.sending,
      );

      return Right(optimisticMessage);
    } catch (e) {
      if (e is DioException) {
        return Left(_handleDioException(e));
      }
      return Left(UnknownFailure(e.toString()));
    }
  }

  @override
  Stream<Either<Failure, Message>> listenToMessages() async* {
    try {
      final currentUserId = await _getCurrentUserId();

      await for (final model in _webSocketDataSource.messageStream) {
        yield Right(model.toEntity(currentUserId));
      }
    } catch (e) {
      yield Left(WebSocketFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> joinConversation(String conversationId) async {
    try {
      await _webSocketDataSource.joinConversation(conversationId);
      return const Right(null);
    } catch (e) {
      return Left(WebSocketFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> leaveConversation(String conversationId) async {
    try {
      await _webSocketDataSource.leaveConversation(conversationId);
      return const Right(null);
    } catch (e) {
      return Left(WebSocketFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> connectWebSocket() async {
    try {
      await _webSocketDataSource.connect();
      return const Right(null);
    } catch (e) {
      return Left(WebSocketFailure(e.toString()));
    }
  }

  @override
  Future<void> disconnectWebSocket() async {
    await _webSocketDataSource.disconnect();
  }

  @override
  Stream<WebSocketState> get connectionState {
    return _webSocketDataSource.connectionStateStream.map((state) {
      switch (state) {
        case WebSocketConnectionState.disconnected:
          return WebSocketState.disconnected;
        case WebSocketConnectionState.connecting:
          return WebSocketState.connecting;
        case WebSocketConnectionState.connected:
          return WebSocketState.connected;
        case WebSocketConnectionState.error:
          return WebSocketState.error;
      }
    });
  }

  @override
  Future<Either<Failure, void>> emitTyping(String conversationId) async {
    try {
      await _webSocketDataSource.emitTyping(conversationId);
      return const Right(null);
    } catch (e) {
      return Left(WebSocketFailure(e.toString()));
    }
  }

  @override
  Stream<TypingEvent> listenToTyping() {
    return _webSocketDataSource.typingStream;
  }

  /// Get current user ID from local storage
  Future<String> _getCurrentUserId() async {
    return await _storage.read(key: 'userId') ?? '';
  }

  /// Get current user info from local storage
  Future<Map<String, dynamic>> _getCurrentUser() async {
    final id = await _storage.read(key: 'userId');
    final displayName = await _storage.read(key: 'displayName');
    final avatarUrl = await _storage.read(key: 'avatarUrl');

    return {
      'id': id ?? '',
      'displayName': displayName ?? 'You',
      'avatarUrl': avatarUrl,
    };
  }

  /// Map DioException to domain Failure
  Failure _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkFailure(ErrorKeys.connectionTimeout);

      case DioExceptionType.connectionError:
        return const NetworkFailure(ErrorKeys.noInternet);

      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        if (statusCode == 401 || statusCode == 403) {
          return const AuthFailure(ErrorKeys.authFailed);
        }
        return ServerFailure(e.response?.data?['message'] ?? ErrorKeys.server);

      case DioExceptionType.cancel:
        return const UnknownFailure(ErrorKeys.requestCancelled);

      default:
        return UnknownFailure(e.message ?? ErrorKeys.unknown);
    }
  }
}
