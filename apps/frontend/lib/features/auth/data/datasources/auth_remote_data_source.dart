import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String email, String password);
  Future<UserModel?> getProfile();
  Future<UserModel> register(String name, String email, String password);
  Future<UserModel> verifyEmail(String email, String otp);
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
      return (await getProfile())!;
    }
  }

  @override
  Future<UserModel?> getProfile() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) return null;

      final response = await _dio.get(
        '/users/me',
        options: Options(headers: {'Authorization': 'Bearer \$token'}),
      );
      return UserModel.fromJson(response.data);
    } catch (e) {
      // The method implicitly returns null if an error occurs and no explicit return is made in the catch block.
    }
    return null; // This line ensures null is returned if an error occurs in the try block.
  }

  @override
  Future<UserModel> register(String name, String email, String password) async {
    final response = await _dio.post(
      '/auth/signup',
      data: {'displayName': name, 'email': email, 'password': password},
    );

    final accessToken = response.data['accessToken'];
    final refreshToken = response.data['refreshToken'];

    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);

    if (response.data['user'] != null) {
      return UserModel.fromJson(response.data['user']);
    } else {
      return (await getProfile())!;
    }
  }

  @override
  Future<UserModel> verifyEmail(String email, String otp) async {
    await _dio.post('/auth/verify-email', data: {'email': email, 'otp': otp});
    // After verification, fetch the updated profile to get isEmailVerified=true
    final user = await getProfile();
    if (user == null) {
      throw Exception(
        'Verification successful but failed to receive user profile',
      );
    }
    return user;
  }
}
