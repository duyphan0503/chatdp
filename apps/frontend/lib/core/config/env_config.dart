import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../utils/app_logger.dart';

class EnvConfig {
  static String get baseUrl => _get('BASE_URL');
  static String get wsUrl => _get('WS_URL');
  static int get connectTimeout => int.parse(_get('CONNECT_TIMEOUT'));
  static int get receiveTimeout => int.parse(_get('RECEIVE_TIMEOUT'));
  static String get googleClientId => _get('GOOGLE_CLIENT_ID');
  static String get googleClientSecret => _get('GOOGLE_CLIENT_SECRET');
  static int get googleRedirectPort => int.parse(_get('GOOGLE_REDIRECT_PORT'));

  static String get googleClientIdAndroid => _get('GOOGLE_CLIENT_ID_ANDROID');
  static String get googleClientIdDesktop => _get('GOOGLE_CLIENT_ID_DESKTOP');
  static String get googleClientSecretDesktop =>
      _get('GOOGLE_CLIENT_SECRET_DESKTOP');

  static Future<void> init() async {
    try {
      await dotenv.load(fileName: ".env");
    } catch (e, stack) {
      AppLogger.error('Failed to load .env file', e, stack);
      rethrow;
    }
  }

  static String _get(String key) {
    final value = dotenv.env[key];
    if (value == null || value.isEmpty) {
      final msg = 'CRITICAL: Missing environment variable "$key" in .env';
      AppLogger.error(msg);
      throw Exception(msg); // This exception is for Devs; it crashes app start.
    }
    return value;
  }
}
