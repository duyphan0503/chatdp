import 'dart:async';
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:frontend/features/chat/domain/repositories/chat_repository.dart';
import 'package:frontend/features/chat/domain/usecases/get_messages_usecase.dart';
import 'package:frontend/features/chat/domain/usecases/listen_to_messages_usecase.dart';
import 'package:frontend/features/chat/domain/usecases/send_image_usecase.dart';
import 'package:frontend/features/chat/domain/usecases/send_message_usecase.dart';
import 'package:frontend/features/chat/presentation/bloc/chat_detail/chat_detail_bloc.dart';
import 'package:frontend/features/chat/presentation/bloc/chat_detail/chat_detail_event.dart';
import 'package:frontend/features/chat/presentation/bloc/chat_detail/chat_detail_state.dart';
import 'package:mocktail/mocktail.dart';

class MockGetMessagesUseCase extends Mock implements GetMessagesUseCase {}

class MockSendMessageUseCase extends Mock implements SendMessageUseCase {}

class MockSendImageUseCase extends Mock implements SendImageUseCase {}

class MockListenToMessagesUseCase extends Mock
    implements ListenToMessagesUseCase {}

class MockChatRepository extends Mock implements IChatRepository {}

void main() {
  late ChatDetailBloc bloc;
  late MockGetMessagesUseCase mockGetMessages;
  late MockSendMessageUseCase mockSendMessage;
  late MockSendImageUseCase mockSendImage;
  late MockListenToMessagesUseCase mockListenToMessages;
  late MockChatRepository mockRepository;

  const tConversationId = 'conv_123';

  setUp(() {
    mockGetMessages = MockGetMessagesUseCase();
    mockSendMessage = MockSendMessageUseCase();
    mockSendImage = MockSendImageUseCase();
    mockListenToMessages = MockListenToMessagesUseCase();
    mockRepository = MockChatRepository();

    // Default stubs for auto-triggered events
    when(
      () => mockRepository.joinConversation(any()),
    ).thenAnswer((_) async => const Right(null));
    when(
      () => mockRepository.leaveConversation(any()),
    ).thenAnswer((_) async => const Right(null));
    when(() => mockListenToMessages()).thenAnswer((_) => const Stream.empty());
    when(
      () => mockRepository.listenToTyping(),
    ).thenAnswer((_) => const Stream.empty());
    when(
      () => mockGetMessages(
        conversationId: any(named: 'conversationId'),
        limit: any(named: 'limit'),
        cursor: any(named: 'cursor'),
      ),
    ).thenAnswer((_) async => const Right([]));
  });

  tearDown(() {
    bloc.close();
  });

  group('ChatDetailBloc - Typing Events', () {
    blocTest<ChatDetailBloc, ChatDetailState>(
      'emits state with typing user when userTypingReceived event is added',
      build: () {
        bloc = ChatDetailBloc(
          mockGetMessages,
          mockSendMessage,
          mockSendImage,
          mockListenToMessages,
          mockRepository,
          tConversationId,
        );
        return bloc;
      },
      skip: 2, // Skip initial loading states
      act: (bloc) => bloc.add(
        const ChatDetailEvent.userTypingReceived(
          userId: 'user_456',
          userName: 'John Doe',
        ),
      ),
      expect: () => [
        predicate<ChatDetailState>((state) {
          return state.typingUserIds.contains('user_456') &&
              state.typingUsers['user_456'] == 'John Doe';
        }),
      ],
    );

    blocTest<ChatDetailBloc, ChatDetailState>(
      'emitTyping is called when startTyping event is added',
      build: () {
        when(
          () => mockRepository.emitTyping(any()),
        ).thenAnswer((_) async => const Right(null));
        bloc = ChatDetailBloc(
          mockGetMessages,
          mockSendMessage,
          mockSendImage,
          mockListenToMessages,
          mockRepository,
          tConversationId,
        );
        return bloc;
      },
      act: (bloc) => bloc.add(const ChatDetailEvent.startTyping()),
      verify: (_) {
        verify(() => mockRepository.emitTyping(tConversationId)).called(1);
      },
    );

    blocTest<ChatDetailBloc, ChatDetailState>(
      'handles multiple typing users correctly',
      build: () {
        bloc = ChatDetailBloc(
          mockGetMessages,
          mockSendMessage,
          mockSendImage,
          mockListenToMessages,
          mockRepository,
          tConversationId,
        );
        return bloc;
      },
      skip: 2, // Skip initial loading states
      act: (bloc) async {
        bloc.add(
          const ChatDetailEvent.userTypingReceived(
            userId: 'user_1',
            userName: 'Alice',
          ),
        );
        await Future.delayed(const Duration(milliseconds: 10));
        bloc.add(
          const ChatDetailEvent.userTypingReceived(
            userId: 'user_2',
            userName: 'Bob',
          ),
        );
        await Future.delayed(const Duration(milliseconds: 10));
        bloc.add(const ChatDetailEvent.userStoppedTyping(userId: 'user_1'));
      },
      expect: () => [
        predicate<ChatDetailState>(
          (state) =>
              state.typingUserIds.length == 1 &&
              state.typingUserIds.contains('user_1'),
        ),
        predicate<ChatDetailState>(
          (state) =>
              state.typingUserIds.length == 2 &&
              state.typingUserIds.contains('user_1') &&
              state.typingUserIds.contains('user_2'),
        ),
        predicate<ChatDetailState>(
          (state) =>
              state.typingUserIds.length == 1 &&
              state.typingUserIds.contains('user_2') &&
              !state.typingUserIds.contains('user_1'),
        ),
      ],
    );
  });

  group('ChatDetailBloc - Typing Stream', () {
    test('listens to typing events when joining conversation', () async {
      final typingController = StreamController<TypingEvent>();

      when(
        () => mockRepository.listenToTyping(),
      ).thenAnswer((_) => typingController.stream);

      bloc = ChatDetailBloc(
        mockGetMessages,
        mockSendMessage,
        mockSendImage,
        mockListenToMessages,
        mockRepository,
        tConversationId,
      );

      // Wait for auto-join
      await Future.delayed(const Duration(milliseconds: 100));

      // Emit typing event
      typingController.add(
        TypingEvent(
          conversationId: tConversationId,
          userId: 'user_789',
          userName: 'Charlie',
          isTyping: true,
        ),
      );

      await Future.delayed(const Duration(milliseconds: 100));

      expect(bloc.state.typingUserIds, contains('user_789'));
      expect(bloc.state.typingUsers['user_789'], equals('Charlie'));

      typingController.close();
    });

    test('ignores typing events from other conversations', () async {
      final typingController = StreamController<TypingEvent>();

      when(
        () => mockRepository.listenToTyping(),
      ).thenAnswer((_) => typingController.stream);

      bloc = ChatDetailBloc(
        mockGetMessages,
        mockSendMessage,
        mockSendImage,
        mockListenToMessages,
        mockRepository,
        tConversationId,
      );

      await Future.delayed(const Duration(milliseconds: 100));

      // Emit typing event for different conversation
      typingController.add(
        TypingEvent(
          conversationId: 'different_conv',
          userId: 'user_789',
          userName: 'Charlie',
          isTyping: true,
        ),
      );

      await Future.delayed(const Duration(milliseconds: 100));

      expect(bloc.state.typingUserIds, isEmpty);

      typingController.close();
    });

    test('removes user when isTyping is false', () async {
      final typingController = StreamController<TypingEvent>();

      when(
        () => mockRepository.listenToTyping(),
      ).thenAnswer((_) => typingController.stream);

      bloc = ChatDetailBloc(
        mockGetMessages,
        mockSendMessage,
        mockSendImage,
        mockListenToMessages,
        mockRepository,
        tConversationId,
      );

      await Future.delayed(const Duration(milliseconds: 100));

      // User starts typing
      typingController.add(
        TypingEvent(
          conversationId: tConversationId,
          userId: 'user_789',
          userName: 'Charlie',
          isTyping: true,
        ),
      );

      await Future.delayed(const Duration(milliseconds: 100));
      expect(bloc.state.typingUserIds, contains('user_789'));

      // User stops typing
      typingController.add(
        TypingEvent(
          conversationId: tConversationId,
          userId: 'user_789',
          userName: 'Charlie',
          isTyping: false,
        ),
      );

      await Future.delayed(const Duration(milliseconds: 100));
      expect(bloc.state.typingUserIds, isEmpty);

      typingController.close();
    });
  });
}
