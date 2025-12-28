import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

/// Remote data source for chat operations via REST API.
///
/// This handles all HTTP requests to the backend chat endpoints.
abstract class IChatRemoteDataSource {
  /// Get list of conversations
  Future<List<ConversationModel>> getConversations();

  /// Get messages for a conversation with pagination
  Future<List<MessageModel>> getMessages({
    required String conversationId,
    String? cursor,
    int limit = 20,
  });

  /// Send a message (via REST API as fallback)
  Future<MessageModel> sendMessage({
    required String conversationId,
    required String content,
  });
}

@LazySingleton(as: IChatRemoteDataSource)
class ChatRemoteDataSource implements IChatRemoteDataSource {
  final Dio _dio;

  ChatRemoteDataSource(this._dio);

  @override
  Future<List<ConversationModel>> getConversations() async {
    try {
      final response = await _dio.get('/conversations');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data
            .map(
              (json) =>
                  ConversationModel.fromJson(json as Map<String, dynamic>),
            )
            .toList();
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
          message: 'Failed to fetch conversations',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<List<MessageModel>> getMessages({
    required String conversationId,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get(
        '/conversations/$conversationId/messages',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data
            .map((json) => MessageModel.fromJson(json as Map<String, dynamic>))
            .toList();
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
          message: 'Failed to fetch messages',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<MessageModel> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    try {
      final response = await _dio.post(
        '/conversations/$conversationId/messages',
        data: {'content': content, 'contentType': 'text'},
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return MessageModel.fromJson(response.data as Map<String, dynamic>);
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
          message: 'Failed to send message',
        );
      }
    } catch (e) {
      rethrow;
    }
  }
}
