import 'package:flutter/foundation.dart';
import 'package:injectable/injectable.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in_all_platforms/google_sign_in_all_platforms.dart';
import '../../../../core/config/env_config.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _dataSource;
  final FlutterSecureStorage _storage;
  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    params: _getGoogleSignInParams(),
  );

  GoogleSignInParams _getGoogleSignInParams() {
    // Web
    if (kIsWeb) {
      return GoogleSignInParams(
        clientId: EnvConfig.googleClientIdDesktop,
        clientSecret: EnvConfig.googleClientSecretDesktop,
        scopes: const ['email', 'profile', 'openid'],
        redirectPort: EnvConfig.googleRedirectPort,
      );
    }

    // Platform check using defaultTargetPlatform (safe for cross-platform)
    switch (defaultTargetPlatform) {
      case TargetPlatform.linux:
      case TargetPlatform.windows:
      case TargetPlatform.macOS:
        return GoogleSignInParams(
          clientId: EnvConfig.googleClientIdDesktop,
          clientSecret: EnvConfig.googleClientSecretDesktop,
          scopes: const ['email', 'profile', 'openid'],
          redirectPort: EnvConfig.googleRedirectPort,
        );
      case TargetPlatform.android:
      case TargetPlatform.iOS:
      default:
        return GoogleSignInParams(
          clientId: EnvConfig.googleClientIdAndroid,
          scopes: const ['email', 'profile', 'openid'],
          redirectPort: EnvConfig.googleRedirectPort,
        );
    }
  }

  AuthRepositoryImpl(this._dataSource, this._storage);

  @override
  Future<UserEntity> login(String email, String password) async {
    final userModel = await _dataSource.login(email, password);
    return userModel.toEntity();
  }

  @override
  Future<UserEntity?> checkAuth() async {
    try {
      final userModel = await _dataSource.getProfile();
      return userModel?.toEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> logout() async {
    await _storage.deleteAll();
    await _googleSignIn.signOut();
  }

  @override
  Future<UserEntity> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final userModel = await _dataSource.register(name, email, password);
    return userModel.toEntity();
  }

  @override
  Future<UserEntity> verifyEmail(String email, String otp) async {
    final userModel = await _dataSource.verifyEmail(email, otp);
    return userModel.toEntity();
  }

  @override
  Future<void> resendVerificationEmail(String email) async {
    await _dataSource.resendVerificationEmail(email);
  }

  @override
  Future<void> forgotPassword(String email) async {
    await _dataSource.forgotPassword(email);
  }

  @override
  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    await _dataSource.resetPassword(email, otp, newPassword);
  }

  @override
  Future<UserEntity> googleLogin() async {
    final credentials = await _googleSignIn.signIn();
    if (credentials == null) {
      throw Exception('Google Sign In aborted');
    }

    final token = credentials.idToken ?? credentials.accessToken;
    // Note: token is inferred as non-nullable String by analyzer in this package version

    final userModel = await _dataSource.googleLogin(token);

    return userModel.toEntity();
  }

  @override
  Future<UserEntity> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final userModel = await _dataSource.register(name, email, password);
    return userModel.toEntity();
  }

  @override
  Future<UserEntity> verifyEmail(String email, String otp) async {
    final userModel = await _dataSource.verifyEmail(email, otp);
    return userModel.toEntity();
  }
}
