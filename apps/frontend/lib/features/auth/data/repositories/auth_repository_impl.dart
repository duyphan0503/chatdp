import 'package:injectable/injectable.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _dataSource;
  final FlutterSecureStorage _storage;

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
