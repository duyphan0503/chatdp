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
import 'package:shared_preferences/shared_preferences.dart' as _i460;

import '../../features/auth/data/datasources/auth_remote_data_source.dart'
    as _i107;
import '../../features/auth/data/repositories/auth_repository_impl.dart'
    as _i153;
import '../../features/auth/domain/repositories/auth_repository.dart' as _i787;
import '../../features/auth/presentation/bloc/auth_bloc.dart' as _i797;
import '../../features/chat/data/datasources/chat_remote_data_source.dart'
    as _i980;
import '../../features/chat/data/datasources/chat_websocket_data_source.dart'
    as _i527;
import '../../features/chat/data/repositories/chat_repository_impl.dart'
    as _i504;
import '../../features/chat/domain/repositories/chat_repository.dart' as _i420;
import '../../features/chat/domain/usecases/get_conversations_usecase.dart'
    as _i194;
import '../../features/chat/domain/usecases/get_messages_usecase.dart' as _i325;
import '../../features/chat/domain/usecases/listen_to_messages_usecase.dart'
    as _i952;
import '../../features/chat/domain/usecases/send_message_usecase.dart' as _i795;
import '../../features/chat/presentation/bloc/chat_detail/chat_detail_bloc.dart'
    as _i822;
import '../../features/chat/presentation/bloc/conversation_list/conversation_list_cubit.dart'
    as _i108;
import '../../features/settings/data/datasources/settings_local_data_source.dart'
    as _i599;
import '../../features/settings/data/repositories/settings_repository_impl.dart'
    as _i955;
import '../../features/settings/domain/repositories/settings_repository.dart'
    as _i674;
import '../../features/settings/presentation/cubit/language_cubit.dart'
    as _i530;
import '../../features/settings/presentation/cubit/theme_cubit.dart' as _i124;
import '../network/auth_interceptor.dart' as _i908;
import '../network/dio_client.dart' as _i667;
import 'storage_module.dart' as _i371;

extension GetItInjectableX on _i174.GetIt {
  // initializes the registration of main-scope dependencies inside of GetIt
  Future<_i174.GetIt> init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) async {
    final gh = _i526.GetItHelper(this, environment, environmentFilter);
    final storageModule = _$StorageModule();
    final networkModule = _$NetworkModule();
    await gh.factoryAsync<_i460.SharedPreferences>(
      () => storageModule.prefs,
      preResolve: true,
    );
    gh.lazySingleton<_i558.FlutterSecureStorage>(() => storageModule.storage);
    gh.lazySingleton<_i599.SettingsLocalDataSource>(
      () => _i599.SettingsLocalDataSourceImpl(gh<_i460.SharedPreferences>()),
    );
    gh.factory<_i908.AuthInterceptor>(
      () => _i908.AuthInterceptor(gh<_i558.FlutterSecureStorage>()),
    );
    gh.lazySingleton<_i527.IChatWebSocketDataSource>(
      () => _i527.ChatWebSocketDataSource(gh<_i558.FlutterSecureStorage>()),
    );
    gh.lazySingleton<_i674.SettingsRepository>(
      () => _i955.SettingsRepositoryImpl(gh<_i599.SettingsLocalDataSource>()),
    );
    gh.factory<_i530.LanguageCubit>(
      () => _i530.LanguageCubit(gh<_i674.SettingsRepository>()),
    );
    gh.factory<_i124.ThemeCubit>(
      () => _i124.ThemeCubit(gh<_i674.SettingsRepository>()),
    );
    gh.lazySingleton<_i361.Dio>(
      () => networkModule.dio(gh<_i908.AuthInterceptor>()),
    );
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
    gh.lazySingleton<_i980.IChatRemoteDataSource>(
      () => _i980.ChatRemoteDataSource(gh<_i361.Dio>()),
    );
    gh.factory<_i797.AuthBloc>(
      () => _i797.AuthBloc(gh<_i787.AuthRepository>()),
    );
    gh.lazySingleton<_i420.IChatRepository>(
      () => _i504.ChatRepositoryImpl(
        gh<_i980.IChatRemoteDataSource>(),
        gh<_i527.IChatWebSocketDataSource>(),
      ),
    );
    gh.factory<_i194.GetConversationsUseCase>(
      () => _i194.GetConversationsUseCase(gh<_i420.IChatRepository>()),
    );
    gh.factory<_i325.GetMessagesUseCase>(
      () => _i325.GetMessagesUseCase(gh<_i420.IChatRepository>()),
    );
    gh.factory<_i952.ListenToMessagesUseCase>(
      () => _i952.ListenToMessagesUseCase(gh<_i420.IChatRepository>()),
    );
    gh.factory<_i795.SendMessageUseCase>(
      () => _i795.SendMessageUseCase(gh<_i420.IChatRepository>()),
    );
    gh.factoryParam<_i822.ChatDetailBloc, String, dynamic>(
      (conversationId, _) => _i822.ChatDetailBloc(
        gh<_i325.GetMessagesUseCase>(),
        gh<_i795.SendMessageUseCase>(),
        gh<_i952.ListenToMessagesUseCase>(),
        gh<_i420.IChatRepository>(),
        conversationId,
      ),
    );
    gh.factory<_i108.ConversationListCubit>(
      () => _i108.ConversationListCubit(gh<_i194.GetConversationsUseCase>()),
    );
    return this;
  }
}

class _$StorageModule extends _i371.StorageModule {}

class _$NetworkModule extends _i667.NetworkModule {}
