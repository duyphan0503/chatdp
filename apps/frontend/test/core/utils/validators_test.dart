import 'package:flutter/material.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/utils/validators.dart';
import 'package:frontend/l10n/app_localizations.dart';

void main() {
  Widget createLocalizedWrapper(Widget child) {
    return MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(body: child),
    );
  }

  group('AppValidators', () {
    testWidgets('name validation', (tester) async {
      await tester.pumpWidget(
        createLocalizedWrapper(
          Builder(
            builder: (context) {
              // Null
              expect(
                AppValidators.name(context, null),
                isNotNull,
              ); // "Name is required" but l10n resolved
              // Empty
              expect(AppValidators.name(context, ''), isNotNull);
              // Whitespace
              expect(AppValidators.name(context, '   '), isNotNull);
              // Too short
              expect(
                AppValidators.name(context, 'A'),
                'Name must be at least 2 characters',
              );
              // Valid
              expect(AppValidators.name(context, 'John Doe'), null);
              return const SizedBox();
            },
          ),
        ),
      );
    });

    testWidgets('otp validation', (tester) async {
      await tester.pumpWidget(
        createLocalizedWrapper(
          Builder(
            builder: (context) {
              // Null
              expect(AppValidators.otp(context, null), 'OTP is required');
              // Empty
              expect(AppValidators.otp(context, ''), 'OTP is required');
              // Wrong length
              expect(
                AppValidators.otp(context, '12345'),
                'OTP must be 6 digits',
              );
              // Non-digit
              expect(
                AppValidators.otp(context, '12345a'),
                'OTP must be 6 digits',
              );
              // Valid
              expect(AppValidators.otp(context, '123456'), null);
              return const SizedBox();
            },
          ),
        ),
      );
    });

    testWidgets('email validation', (tester) async {
      await tester.pumpWidget(
        createLocalizedWrapper(
          Builder(
            builder: (context) {
              // Null/Empty
              expect(AppValidators.email(context, null), 'Email is required');
              expect(AppValidators.email(context, ''), 'Email is required');
              // Invalid
              expect(
                AppValidators.email(context, 'invalid'),
                'Please enter a valid email',
              );
              // Valid
              expect(AppValidators.email(context, 'test@example.com'), null);
              return const SizedBox();
            },
          ),
        ),
      );
    });
  });
}
