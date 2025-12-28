import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';
import '../utils/app_logger.dart';
import '../config/env_config.dart';

@injectable
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _refreshDio;

  AuthInterceptor(this._storage)
    : _refreshDio = Dio(BaseOptions(baseUrl: EnvConfig.baseUrl));

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'accessToken');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      final refreshToken = await _storage.read(key: 'refreshToken');
      if (refreshToken == null) {
        return handler.next(err);
      }

      try {
        final response = await _refreshDio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        );

        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];

        await _storage.write(key: 'accessToken', value: newAccessToken);
        await _storage.write(key: 'refreshToken', value: newRefreshToken);

        // Update the original request with the new token
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';

        // Retry the request
        final cloneReq = await _refreshDio.request(
          opts.path,
          options: Options(
            method: opts.method,
            headers: opts.headers,
            extra: opts.extra,
            responseType: opts.responseType,
            contentType: opts.contentType,
            validateStatus: opts.validateStatus,
            receiveTimeout: opts.receiveTimeout,
            sendTimeout: opts.sendTimeout,
          ),
          data: opts.data,
          queryParameters: opts.queryParameters,
        );

        return handler.resolve(cloneReq);
      } catch (e) {
        // Refresh failed, logout
        await _storage.deleteAll();
        AppLogger.error('Token refresh failed', e);
        return handler.next(err);
      }
    }
    handler.next(err);
  }
}
