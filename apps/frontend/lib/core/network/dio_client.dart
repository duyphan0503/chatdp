import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../config/env_config.dart';
import 'auth_interceptor.dart';

@module
abstract class NetworkModule {
  @lazySingleton
  Dio dio(AuthInterceptor authInterceptor) {
    final dio = Dio();
    dio.options.baseUrl = EnvConfig.baseUrl;
    dio.options.connectTimeout = Duration(
      milliseconds: EnvConfig.connectTimeout,
    );
    dio.options.receiveTimeout = Duration(
      milliseconds: EnvConfig.receiveTimeout,
    );
    dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    dio.interceptors.add(authInterceptor);
    dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
    return dio;
  }
}
