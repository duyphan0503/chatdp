import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../../../../core/utils/app_logger.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String email, String password);
  Future<UserModel?> getProfile();
  Future<UserModel> register(String name, String email, String password);
  Future<UserModel> verifyEmail(String email, String otp);
  Future<void> resendVerificationEmail(String email);
  Future<void> forgotPassword(String email);
  Future<void> resetPassword(String email, String otp, String newPassword);
  Future<UserModel> googleLogin(String token);
}

@LazySingleton(as: AuthRemoteDataSource)
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthRemoteDataSourceImpl(this._dio, this._storage);

  @override
  Future<UserModel> login(String email, String password) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );

    final accessToken = response.data['accessToken'];
    final refreshToken = response.data['refreshToken'];

    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);

    if (response.data['user'] != null) {
      return UserModel.fromJson(response.data['user']);
    } else {
      final profile = await getProfile();
      if (profile != null) {
        return profile;
      }
      throw Exception('Login successful but failed to fetch user profile');
    }
  }

  @override
  Future<UserModel?> getProfile() async {
    try {
      final response = await _dio.get('/users/me');
      return UserModel.fromJson(response.data);
    } catch (e) {
      // The method implicitly returns null if an error occurs
      AppLogger.error('Failed to get profile', e);
      return null;
    }
  }

  @override
  Future<UserModel> register(String name, String email, String password) async {
    try {
      AppLogger.info('Registering user: $email');
      final response = await _dio.post(
        '/auth/signup',
        data: {'displayName': name, 'email': email, 'password': password},
      );

      final accessToken = response.data['accessToken'];
      final refreshToken = response.data['refreshToken'];

      await _storage.write(key: 'accessToken', value: accessToken);
      await _storage.write(key: 'refreshToken', value: refreshToken);

      AppLogger.info('Registration successful for: $email');

      if (response.data['user'] != null) {
        return UserModel.fromJson(response.data['user']);
      } else {
        final profile = await getProfile();
        if (profile != null) {
          return profile;
        }
        throw Exception(
          'Registration successful but failed to fetch user profile',
        );
      }
    } catch (e) {
      AppLogger.error('Registration failed for $email', e);
      rethrow;
    }
  }

  @override
  Future<UserModel> verifyEmail(String email, String otp) async {
    try {
      AppLogger.info('Verifying email: $email with OTP: $otp');
      await _dio.post('/auth/verify-email', data: {'email': email, 'otp': otp});

      AppLogger.info('Email verified successfully. Fetching profile...');
      final user = await getProfile();
      if (user == null) {
        throw Exception(
          'Verification successful but failed to receive user profile',
        );
      }
      return user;
    } catch (e) {
      AppLogger.error('Verify email failed for $email', e);
      rethrow;
    }
  }

  @override
  Future<void> resendVerificationEmail(String email) async {
    try {
      AppLogger.info('Resending verification email to: $email');
      await _dio.post('/auth/send-verification-email', data: {'email': email});
      AppLogger.info('Resend successful');
    } catch (e) {
      AppLogger.error('Resend verification failed for $email', e);
      rethrow;
    }
  }

  @override
  Future<void> forgotPassword(String email) async {
    try {
      AppLogger.info('Requesting password reset for: $email');
      await _dio.post('/auth/forgot-password', data: {'email': email});
      AppLogger.info('Password reset request successful');
    } catch (e) {
      AppLogger.error('Password reset request failed for $email', e);
      rethrow;
    }
  }

  @override
  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      AppLogger.info('Resetting password for: $email');
      await _dio.post(
        '/auth/reset-password',
        data: {'email': email, 'otp': otp, 'newPassword': newPassword},
      );
      AppLogger.info('Password reset successful');
    } catch (e) {
      AppLogger.error('Password reset failed for $email', e);
      rethrow;
    }
  }

  @override
  Future<UserModel> googleLogin(String token) async {
    try {
      AppLogger.info('Logging in with Google');
      final response = await _dio.post('/auth/google', data: {'token': token});

      final accessToken = response.data['accessToken'];
      final refreshToken = response.data['refreshToken'];

      await _storage.write(key: 'accessToken', value: accessToken);
      await _storage.write(key: 'refreshToken', value: refreshToken);

      if (response.data['user'] != null) {
        return UserModel.fromJson(response.data['user']);
      } else {
        final profile = await getProfile();
        if (profile != null) {
          return profile;
        }
        throw Exception(
          'Google login successful but failed to fetch user profile',
        );
      }
    } catch (e) {
      AppLogger.error('Google login failed', e);
      rethrow;
    }
  }
}
