import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/di/injection.dart';
import 'package:frontend/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:frontend/features/settings/presentation/cubit/language_cubit.dart';
import 'package:frontend/features/auth/presentation/pages/login_page.dart';
import 'package:frontend/l10n/app_localizations.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}

class MockLanguageCubit extends MockBloc<void, Locale>
    implements LanguageCubit {}

void main() {
  late MockAuthBloc mockAuthBloc;
  late MockLanguageCubit mockLanguageCubit;

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    mockLanguageCubit = MockLanguageCubit();

    // Default stubs
    when(() => mockLanguageCubit.state).thenReturn(const Locale('en'));
    when(
      () => mockLanguageCubit.stream,
    ).thenAnswer((_) => const Stream.empty());

    // AuthBloc needs to be in GetIt if used from there, but LoginPage uses context.read/watch usually.
    // However, let's keep it consistent if GetIt is used somewhere.
    if (getIt.isRegistered<AuthBloc>()) {
      getIt.unregister<AuthBloc>();
    }
    getIt.registerSingleton<AuthBloc>(mockAuthBloc);
  });

  tearDown(() {
    getIt.reset();
  });

  Widget createWidgetUnderTest() {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        BlocProvider<LanguageCubit>.value(value: mockLanguageCubit),
      ],
      child: const MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: LoginPage(),
      ),
    );
  }

  testWidgets('LoginPage renders correctly', (tester) async {
    when(() => mockAuthBloc.state).thenReturn(AuthInitial());

    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pump(); // Allow translations to load

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('SIGN IN'), findsOneWidget); // Default EN
  });

  testWidgets('LoginPage shows loading when state is AuthLoading', (
    tester,
  ) async {
    when(() => mockAuthBloc.state).thenReturn(AuthLoading());

    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
