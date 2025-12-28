import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/di/injection.dart';
import 'package:frontend/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:frontend/features/auth/presentation/pages/login_page.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}

void main() {
  late MockAuthBloc mockAuthBloc;

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    if (getIt.isRegistered<AuthBloc>()) {
      getIt.unregister<AuthBloc>();
    }
    getIt.registerSingleton<AuthBloc>(mockAuthBloc);
  });

  tearDown(() {
    getIt.reset();
  });

  testWidgets('LoginPage renders correctly', (tester) async {
    when(() => mockAuthBloc.state).thenReturn(AuthInitial());

    await tester.pumpWidget(
      BlocProvider<AuthBloc>.value(
        value: mockAuthBloc,
        child: const MaterialApp(home: LoginPage()),
      ),
    );

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('SIGN IN'), findsOneWidget);
  });

  testWidgets('LoginPage shows loading when state is AuthLoading', (
    tester,
  ) async {
    when(() => mockAuthBloc.state).thenReturn(AuthLoading());

    await tester.pumpWidget(
      BlocProvider<AuthBloc>.value(
        value: mockAuthBloc,
        child: const MaterialApp(home: LoginPage()),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
