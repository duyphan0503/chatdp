import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:injectable/injectable.dart';
import 'package:mime/mime.dart';
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

  /// Upload a file (image/video/doc)
  Future<String> uploadFile(File file);

  /// Create a conversation (one-to-one)
  Future<ConversationModel> createConversation(String userId);
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
        // 'limit': limit, // Temporarily disabled to prevent backend validation error
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get(
        '/conversations/$conversationId/messages',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final dynamic data = response.data;
        List<dynamic> items;

        if (data is List) {
          items = data;
        } else if (data is Map && data['items'] is List) {
          items = data['items'];
        } else {
          items = [];
        }

        return items
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

  @override
  Future<String> uploadFile(File file) async {
    try {
      final fileName = file.path.split('/').last;
      final mimeType = lookupMimeType(file.path);

      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: mimeType != null ? MediaType.parse(mimeType) : null,
        ),
      });

      final response = await _dio.post(
        '/uploads', // Assuming generic upload endpoint
        data: formData,
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data['url'] as String;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
          message: 'Failed to upload file',
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<ConversationModel> createConversation(String userId) async {
    try {
      final response = await _dio.post(
        '/conversations',
        data: {
          'type': 'private',
          'participantUserIds': [userId],
        },
      );

      return ConversationModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }
}
