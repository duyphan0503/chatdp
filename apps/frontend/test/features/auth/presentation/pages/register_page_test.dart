import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mocktail/mocktail.dart';
import 'package:frontend/features/auth/presentation/pages/register_page.dart';
import 'package:frontend/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:frontend/l10n/app_localizations.dart';

class MockAuthBloc extends Mock implements AuthBloc {}

class MockNavigatorObserver extends Mock implements NavigatorObserver {}

void main() {
  late MockAuthBloc mockAuthBloc;

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(AuthInitial());
    when(() => mockAuthBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  Widget createWidgetUnderTest() {
    return MaterialApp(
      // No GoRouter for simple widget test usually, or MockGoRouter
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: BlocProvider<AuthBloc>.value(
        value: mockAuthBloc,
        child: const RegisterPage(),
      ),
    );
  }

  // Note: RegisterPage uses context.pop() and context.push(), usually requires GoRouter or Navigator.
  // Since GoRouter is used, we might need to mock it or wrap in GoRouter.
  // For simplicity, we can test that widgets render localized text.

  testWidgets('RegisterPage renders localized strings', (tester) async {
    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pump(); // Run one frame to let build complete

    // Check for Create Account title (from arb)
    expect(find.text('Create Account'), findsOneWidget); // Default en
    expect(find.text('Join the future of messaging'), findsOneWidget);
    expect(find.text('Full Name'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Confirm Password'), findsOneWidget);
    expect(find.text('SIGN UP'), findsOneWidget);
  });
}
