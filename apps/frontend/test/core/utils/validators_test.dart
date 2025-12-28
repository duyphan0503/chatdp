import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/core/utils/validators.dart';

void main() {
  group('AppValidators', () {
    group('name', () {
      test('should return error when value is null', () {
        expect(AppValidators.name(null), 'Name is required');
      });

      test('should return error when value is empty', () {
        expect(AppValidators.name(''), 'Name is required');
      });

      test('should return error when value is whitespace', () {
        expect(AppValidators.name('   '), 'Name is required');
      });

      test('should return error when length is less than 2', () {
        expect(AppValidators.name('A'), 'Name must be at least 2 characters');
      });

      test('should return null when value is valid', () {
        expect(AppValidators.name('John Doe'), null);
        expect(AppValidators.name('Xi'), null);
      });
    });

    group('otp', () {
      test('should return error when value is null', () {
        expect(AppValidators.otp(null), 'OTP is required');
      });

      test('should return error when value is empty', () {
        expect(AppValidators.otp(''), 'OTP is required');
      });

      test('should return error when length is not 6', () {
        expect(AppValidators.otp('12345'), 'OTP must be 6 digits');
        expect(AppValidators.otp('1234567'), 'OTP must be 6 digits');
      });

      test('should return error when value contains non-digits', () {
        expect(AppValidators.otp('12345a'), 'OTP must be 6 digits');
      });

      test('should return null when value is valid', () {
        expect(AppValidators.otp('123456'), null);
      });
    });

    group('email', () {
      test('should return error when null or empty', () {
        expect(AppValidators.email(null), 'Email is required');
        expect(AppValidators.email(''), 'Email is required');
      });

      test('should return error when invalid format', () {
        expect(
          AppValidators.email('invalid-email'),
          'Please enter a valid email',
        );
        expect(AppValidators.email('test@'), 'Please enter a valid email');
      });

      test('should return null when valid', () {
        expect(AppValidators.email('test@example.com'), null);
      });
    });
  });
}
