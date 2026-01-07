import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/features/chat/presentation/widgets/chat_input.dart';
import 'package:frontend/l10n/app_localizations.dart';

void main() {
  Widget createWidgetUnderTest({
    required Function(String) onSend,
    Function()? onTyping,
    bool isSending = false,
  }) {
    return MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: ChatInput(
          onSend: onSend,
          onTyping: onTyping,
          isSending: isSending,
        ),
      ),
    );
  }

  group('ChatInput - onTyping Callback', () {
    testWidgets('should call onTyping when user types', (tester) async {
      // Arrange
      int typingCallCount = 0;
      final messages = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: messages.add,
          onTyping: () => typingCallCount++,
        ),
      );

      // Find the TextField
      final textField = find.byType(TextField);
      expect(textField, findsOneWidget);

      // Act - User types
      await tester.enterText(textField, 'H');
      await tester.pump();

      // Assert - onTyping should be called
      expect(typingCallCount, 1);
    });

    testWidgets(
      'should call onTyping multiple times as user continues typing',
      (tester) async {
        // Arrange
        int typingCallCount = 0;
        final messages = <String>[];

        await tester.pumpWidget(
          createWidgetUnderTest(
            onSend: messages.add,
            onTyping: () => typingCallCount++,
          ),
        );

        final textField = find.byType(TextField);

        // Act - User types multiple characters
        await tester.enterText(textField, 'H');
        await tester.pump();
        await tester.enterText(textField, 'He');
        await tester.pump();
        await tester.enterText(textField, 'Hel');
        await tester.pump();
        await tester.enterText(textField, 'Hell');
        await tester.pump();
        await tester.enterText(textField, 'Hello');
        await tester.pump();

        // Assert - onTyping called for each change
        expect(typingCallCount, 5);
      },
    );

    testWidgets('should not call onTyping when text is empty', (tester) async {
      // Arrange
      int typingCallCount = 0;
      final messages = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: messages.add,
          onTyping: () => typingCallCount++,
        ),
      );

      final textField = find.byType(TextField);

      // Act - Enter empty text
      await tester.enterText(textField, '');
      await tester.pump();

      // Assert - onTyping should NOT be called for empty text
      expect(typingCallCount, 0);
    });

    testWidgets('should not crash when onTyping is null', (tester) async {
      // Arrange
      final messages = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: messages.add,
          onTyping: null, // onTyping not provided
        ),
      );

      final textField = find.byType(TextField);

      // Act - User types
      await tester.enterText(textField, 'Hello');
      await tester.pump();

      // Assert - Should not crash, no error
      expect(tester.takeException(), isNull);
    });

    testWidgets(
      'should call onTyping when user types then deletes to non-empty',
      (tester) async {
        // Arrange
        int typingCallCount = 0;
        final messages = <String>[];

        await tester.pumpWidget(
          createWidgetUnderTest(
            onSend: messages.add,
            onTyping: () => typingCallCount++,
          ),
        );

        final textField = find.byType(TextField);

        // Act
        await tester.enterText(textField, 'Hello');
        await tester.pump();
        typingCallCount = 0; // Reset counter

        // User deletes one character
        await tester.enterText(textField, 'Hell');
        await tester.pump();

        // Assert - onTyping still called because text is not empty
        expect(typingCallCount, 1);
      },
    );

    testWidgets('should not call onTyping when clearing text completely', (
      tester,
    ) async {
      // Arrange
      int typingCallCount = 0;
      final messages = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: messages.add,
          onTyping: () => typingCallCount++,
        ),
      );

      final textField = find.byType(TextField);

      // Act
      await tester.enterText(textField, 'Hello');
      await tester.pump();
      typingCallCount = 0; // Reset counter

      // User clears all text
      await tester.enterText(textField, '');
      await tester.pump();

      // Assert - onTyping NOT called for empty text
      expect(typingCallCount, 0);
    });

    testWidgets('should call onTyping when typing spaces (non-empty)', (
      tester,
    ) async {
      // Arrange
      int typingCallCount = 0;
      final messages = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: messages.add,
          onTyping: () => typingCallCount++,
        ),
      );

      final textField = find.byType(TextField);

      // Act - User types spaces (technically not empty)
      await tester.enterText(textField, ' ');
      await tester.pump();

      // Assert - onTyping called because text.isNotEmpty
      expect(typingCallCount, 1);
    });

    testWidgets('should have correct onChanged callback wired up', (
      tester,
    ) async {
      // This test verifies the TextField is properly configured
      await tester.pumpWidget(
        createWidgetUnderTest(onSend: (_) {}, onTyping: () {}),
      );

      final textField = tester.widget<TextField>(find.byType(TextField));

      // Assert - TextField has onChanged callback
      expect(textField.onChanged, isNotNull);
    });

    testWidgets('should render input field with correct placeholder', (
      tester,
    ) async {
      // Arrange
      await tester.pumpWidget(
        createWidgetUnderTest(onSend: (_) {}, onTyping: () {}),
      );

      // Act
      await tester.pump();

      // Assert - Should have placeholder text (from l10n)
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.decoration?.hintText, isNotNull);
    });

    testWidgets('onTyping should be called before onSend when submitting', (
      tester,
    ) async {
      // Arrange
      final events = <String>[];

      await tester.pumpWidget(
        createWidgetUnderTest(
          onSend: (_) => events.add('send'),
          onTyping: () => events.add('typing'),
        ),
      );

      final textField = find.byType(TextField);

      // Act - Type and submit
      await tester.enterText(textField, 'Hello');
      await tester.pump();

      // Clear events
      events.clear();

      // Now change text again before sending
      await tester.enterText(textField, 'Hello!');
      await tester.pump();

      // Submit
      await tester.testTextInput.receiveAction(TextInputAction.send);
      await tester.pump();

      // Assert - Typing event came before send
      expect(events, ['typing', 'send']);
    });
  });
}
