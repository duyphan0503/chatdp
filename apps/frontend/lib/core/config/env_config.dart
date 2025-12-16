import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../utils/app_logger.dart';

class EnvConfig {
  static String get baseUrl => _get('BASE_URL');
  static int get connectTimeout => int.parse(_get('CONNECT_TIMEOUT'));
  static int get receiveTimeout => int.parse(_get('RECEIVE_TIMEOUT'));

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
