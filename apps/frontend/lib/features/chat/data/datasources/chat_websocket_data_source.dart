import 'dart:async';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/message_model.dart';
import '../../domain/repositories/chat_repository.dart';
import '../../../../core/config/env_config.dart';

/// WebSocket data source for real-time chat operations.
///
/// This handles WebSocket connection, authentication, and real-time events.
abstract class IChatWebSocketDataSource {
  /// Connect to WebSocket with JWT authentication
  Future<void> connect();

  /// Disconnect from WebSocket
  Future<void> disconnect();

  /// Join a conversation room
  Future<void> joinConversation(String conversationId);

  /// Leave a conversation room
  Future<void> leaveConversation(String conversationId);

  /// Send a message via WebSocket
  Future<void> sendMessage({
    required String conversationId,
    required String content,
    String contentType = 'text',
  });

  /// Stream of incoming messages
  Stream<MessageModel> get messageStream;

  /// Stream of connection state
  Stream<WebSocketConnectionState> get connectionStateStream;

  /// Emit typing event
  Future<void> emitTyping(String conversationId);

  /// Stream of typing events
  Stream<TypingEvent> get typingStream;

  /// Dispose resources
  void dispose();
}

enum WebSocketConnectionState { disconnected, connecting, connected, error }

@LazySingleton(as: IChatWebSocketDataSource)
class ChatWebSocketDataSource implements IChatWebSocketDataSource {
  final FlutterSecureStorage _storage;

  WebSocketChannel? _channel;
  final _messageController = StreamController<MessageModel>.broadcast();
  final _typingController = StreamController<TypingEvent>.broadcast();
  final _connectionStateController =
      StreamController<WebSocketConnectionState>.broadcast();

  StreamSubscription? _channelSubscription;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _initialReconnectDelay = Duration(seconds: 1);
  Timer? _reconnectTimer;

  ChatWebSocketDataSource(this._storage);

  @override
  Stream<MessageModel> get messageStream => _messageController.stream;

  @override
  Stream<TypingEvent> get typingStream => _typingController.stream;

  @override
  Stream<WebSocketConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  @override
  Future<void> connect() async {
    if (_isConnected) {
      return;
    }

    try {
      _connectionStateController.add(WebSocketConnectionState.connecting);

      // Get access token from secure storage
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        throw Exception('No access token available');
      }

      // Connect to WebSocket
      final wsUrl = EnvConfig.wsUrl;
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      // Wait for connection to be established
      await _channel!.ready;

      // Send authentication
      _sendEvent('authenticate', {'token': token});

      // Listen to messages
      _channelSubscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
        cancelOnError: false,
      );

      _isConnected = true;
      _reconnectAttempts = 0; // Reset on successful connection
      _connectionStateController.add(WebSocketConnectionState.connected);
    } catch (e) {
      _connectionStateController.add(WebSocketConnectionState.error);
      _isConnected = false;
      _scheduleReconnect();
      rethrow;
    }
  }

  /// Schedule reconnection with exponential backoff
  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _connectionStateController.add(WebSocketConnectionState.error);
      return;
    }

    _reconnectAttempts++;
    final delay = _initialReconnectDelay * (1 << (_reconnectAttempts - 1));

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      connect();
    });
  }

  @override
  Future<void> disconnect() async {
    if (!_isConnected) {
      return;
    }

    await _channelSubscription?.cancel();
    await _channel?.sink.close(status.goingAway);
    _channel = null;
    _isConnected = false;
    _connectionStateController.add(WebSocketConnectionState.disconnected);
  }

  @override
  Future<void> joinConversation(String conversationId) async {
    if (!_isConnected) {
      throw Exception('WebSocket not connected');
    }

    _sendEvent('conversation:join', {'conversationId': conversationId});
  }

  @override
  Future<void> leaveConversation(String conversationId) async {
    if (!_isConnected) {
      return;
    }

    _sendEvent('conversation:leave', {'conversationId': conversationId});
  }

  @override
  Future<void> sendMessage({
    required String conversationId,
    required String content,
    String contentType = 'text',
  }) async {
    if (!_isConnected) {
      throw Exception('WebSocket not connected');
    }

    _sendEvent('message:new', {
      'conversationId': conversationId,
      'content': content,
      'contentType': contentType,
    });
  }

  @override
  Future<void> emitTyping(String conversationId) async {
    if (!_isConnected) {
      throw Exception('WebSocket not connected');
    }

    _sendEvent('typing', {'conversationId': conversationId});
  }

  void _sendEvent(String event, Map<String, dynamic> data) {
    if (_channel == null) {
      return;
    }

    final payload = jsonEncode({'event': event, 'data': data});

    _channel!.sink.add(payload);
  }

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message as String) as Map<String, dynamic>;
      final event = data['event'] as String?;

      switch (event) {
        case 'authenticated':
          // Authentication successful
          break;

        case 'unauthorized':
          // Authentication failed
          _connectionStateController.add(WebSocketConnectionState.error);
          disconnect();
          break;

        case 'message:new':
          // New message received
          final messageData = data['data'] as Map<String, dynamic>;
          final messageModel = MessageModel.fromJson(messageData);
          _messageController.add(messageModel);
          break;

        case 'typing':
          // Typing event received
          final typingData = data['data'] as Map<String, dynamic>;
          final typingEvent = TypingEvent(
            conversationId: typingData['conversationId'] as String,
            userId: typingData['userId'] as String,
            userName: typingData['userName'] as String? ?? 'Unknown',
            isTyping: typingData['isTyping'] as bool? ?? true,
          );
          _typingController.add(typingEvent);
          break;

        case 'conversation:joined':
        case 'conversation:left':
          // Conversation room events (can be handled if needed)
          break;

        case 'error':
          // Server error
          final errorMessage =
              data['data']?['message'] as String? ?? 'Unknown error';
          throw Exception(errorMessage);

        default:
          // Unknown event, ignore
          break;
      }
    } catch (e) {
      // Error parsing message, log but don't crash
      _connectionStateController.add(WebSocketConnectionState.error);
    }
  }

  void _handleError(dynamic error) {
    _connectionStateController.add(WebSocketConnectionState.error);
    _isConnected = false;
    _scheduleReconnect(); // Auto-reconnect on error
  }

  void _handleDone() {
    _connectionStateController.add(WebSocketConnectionState.disconnected);
    _isConnected = false;
    _scheduleReconnect(); // Auto-reconnect on disconnect
  }

  @override
  @disposeMethod
  void dispose() {
    _reconnectTimer?.cancel();
    _channelSubscription?.cancel();
    _channel?.sink.close();
    _messageController.close();
    _typingController.close();
    _connectionStateController.close();
  }
}
