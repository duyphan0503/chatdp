import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:frontend/core/error/failures.dart';
import 'package:frontend/features/chat/data/datasources/chat_remote_data_source.dart';
import 'package:frontend/features/chat/data/datasources/chat_websocket_data_source.dart';
import 'package:frontend/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:frontend/features/chat/domain/repositories/chat_repository.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mocktail/mocktail.dart';

class MockChatRemoteDataSource extends Mock implements IChatRemoteDataSource {}

class MockChatWebSocketDataSource extends Mock
    implements IChatWebSocketDataSource {}

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late ChatRepositoryImpl repository;
  late MockChatRemoteDataSource mockRemoteDataSource;
  late MockChatWebSocketDataSource mockWebSocketDataSource;
  late MockFlutterSecureStorage mockStorage;

  setUp(() {
    mockRemoteDataSource = MockChatRemoteDataSource();
    mockWebSocketDataSource = MockChatWebSocketDataSource();
    mockStorage = MockFlutterSecureStorage();

    repository = ChatRepositoryImpl(
      mockRemoteDataSource,
      mockWebSocketDataSource,
      mockStorage,
    );
  });

  group('ChatRepositoryImpl - Typing', () {
    const tConversationId = 'conv_123';

    test('emitTyping should call WebSocket datasource emitTyping', () async {
      // Arrange
      when(
        () => mockWebSocketDataSource.emitTyping(any()),
      ).thenAnswer((_) async {});

      // Act
      final result = await repository.emitTyping(tConversationId);

      // Assert
      expect(result, const Right(null));
      verify(
        () => mockWebSocketDataSource.emitTyping(tConversationId),
      ).called(1);
    });

    test('emitTyping should return WebSocketFailure on error', () async {
      // Arrange
      when(
        () => mockWebSocketDataSource.emitTyping(any()),
      ).thenThrow(Exception('WebSocket error'));

      // Act
      final result = await repository.emitTyping(tConversationId);

      // Assert
      expect(result.isLeft(), true);
      result.fold(
        (failure) => expect(failure, isA<WebSocketFailure>()),
        (_) => fail('Should return failure'),
      );
    });

    test(
      'listenToTyping should return typing stream from WebSocket datasource',
      () {
        // Arrange
        final typingController = StreamController<TypingEvent>();
        when(
          () => mockWebSocketDataSource.typingStream,
        ).thenAnswer((_) => typingController.stream);

        // Act
        final stream = repository.listenToTyping();

        // Assert
        expect(stream, isA<Stream<TypingEvent>>());
        expect(stream, equals(typingController.stream));

        typingController.close();
      },
    );

    test('listenToTyping should emit typing events correctly', () async {
      // Arrange
      final typingController = StreamController<TypingEvent>();
      when(
        () => mockWebSocketDataSource.typingStream,
      ).thenAnswer((_) => typingController.stream);

      final events = <TypingEvent>[];
      final subscription = repository.listenToTyping().listen(events.add);

      // Act
      final event1 = TypingEvent(
        conversationId: tConversationId,
        userId: 'user_1',
        userName: 'Alice',
        isTyping: true,
      );
      final event2 = TypingEvent(
        conversationId: tConversationId,
        userId: 'user_2',
        userName: 'Bob',
        isTyping: true,
      );

      typingController.add(event1);
      typingController.add(event2);

      await Future.delayed(const Duration(milliseconds: 100));

      // Assert
      expect(events.length, 2);
      expect(events[0].userId, 'user_1');
      expect(events[0].userName, 'Alice');
      expect(events[0].isTyping, true);
      expect(events[1].userId, 'user_2');
      expect(events[1].userName, 'Bob');
      expect(events[1].isTyping, true);

      await subscription.cancel();
      typingController.close();
    });

    test('listenToTyping should handle stop typing events', () async {
      // Arrange
      final typingController = StreamController<TypingEvent>();
      when(
        () => mockWebSocketDataSource.typingStream,
      ).thenAnswer((_) => typingController.stream);

      final events = <TypingEvent>[];
      final subscription = repository.listenToTyping().listen(events.add);

      // Act
      final startEvent = TypingEvent(
        conversationId: tConversationId,
        userId: 'user_1',
        userName: 'Alice',
        isTyping: true,
      );
      final stopEvent = TypingEvent(
        conversationId: tConversationId,
        userId: 'user_1',
        userName: 'Alice',
        isTyping: false,
      );

      typingController.add(startEvent);
      typingController.add(stopEvent);

      await Future.delayed(const Duration(milliseconds: 100));

      // Assert
      expect(events.length, 2);
      expect(events[0].isTyping, true);
      expect(events[1].isTyping, false);

      await subscription.cancel();
      typingController.close();
    });
  });
}
