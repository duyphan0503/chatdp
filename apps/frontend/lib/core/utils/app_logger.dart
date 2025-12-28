import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// Centralized logger to ensure strict separation between system logs and user-facing messages.
class AppLogger {
  const AppLogger._();

  /// Logs system errors for developers/admins.
  /// Never show [error] or [stackTrace] directly to the end user.
  static void error(String message, [dynamic error, StackTrace? stackTrace]) {
    if (kReleaseMode) {
      // TODO: Send to Crashlytics or Sentry
    }
    developer.log(
      '❌ SYSTEM ERROR: $message',
      error: error,
      stackTrace: stackTrace,
      name: 'ChatDP.System',
    );
  }

  /// Logs informational messages for debugging.
  static void info(String message) {
    if (kDebugMode) {
      developer.log('ℹ️ INFO: $message', name: 'ChatDP.Info');
    }
  }

  /// Logs network traffic.
  static void network(String message) {
    if (kDebugMode) {
      developer.log('🌐 NETWORK: $message', name: 'ChatDP.Network');
    }
  }
}
