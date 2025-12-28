import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<UserEntity> login(String email, String password);
  Future<UserEntity?> checkAuth();
  Future<void> logout();
  Future<UserEntity> register({
    required String name,
    required String email,
    required String password,
  });
  Future<UserEntity> verifyEmail(String email, String otp);
  Future<void> resendVerificationEmail(String email);
  Future<void> forgotPassword(String email);
  Future<void> resetPassword(String email, String otp, String newPassword);
  Future<UserEntity> googleLogin();
}
