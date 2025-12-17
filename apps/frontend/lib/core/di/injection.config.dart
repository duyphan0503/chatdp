// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format width=80

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:dio/dio.dart' as _i361;
import 'package:flutter_secure_storage/flutter_secure_storage.dart' as _i558;
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;

import '../../features/auth/data/datasources/auth_remote_data_source.dart'
    as _i107;
import '../../features/auth/data/repositories/auth_repository_impl.dart'
    as _i153;
import '../../features/auth/domain/repositories/auth_repository.dart' as _i787;
import '../../features/auth/presentation/bloc/auth_bloc.dart' as _i797;
import '../network/dio_client.dart' as _i667;
import 'storage_module.dart' as _i371;

extension GetItInjectableX on _i174.GetIt {
  // initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(this, environment, environmentFilter);
    final storageModule = _$StorageModule();
    final networkModule = _$NetworkModule();
    gh.lazySingleton<_i558.FlutterSecureStorage>(() => storageModule.storage);
    gh.lazySingleton<_i361.Dio>(() => networkModule.dio);
    gh.lazySingleton<_i107.AuthRemoteDataSource>(
      () => _i107.AuthRemoteDataSourceImpl(
        gh<_i361.Dio>(),
        gh<_i558.FlutterSecureStorage>(),
      ),
    );
    gh.lazySingleton<_i787.AuthRepository>(
      () => _i153.AuthRepositoryImpl(
        gh<_i107.AuthRemoteDataSource>(),
        gh<_i558.FlutterSecureStorage>(),
      ),
    );
    gh.factory<_i797.AuthBloc>(
      () => _i797.AuthBloc(gh<_i787.AuthRepository>()),
    );
    return this;
  }
}

class _$StorageModule extends _i371.StorageModule {}

class _$NetworkModule extends _i667.NetworkModule {}
