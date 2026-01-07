import 'package:flutter/material.dart';
import '../constants/error_keys.dart';
import '../../l10n/app_localizations.dart';

/// Utility class for converting error keys to localized messages
class ErrorLocalization {
  ErrorLocalization._();

  /// Convert error message to localized string
  /// If the message matches an ErrorKeys constant, returns localized message
  /// Otherwise, returns the original message (for server messages, etc.)
  static String getLocalizedMessage(BuildContext context, String message) {
    final l10n = AppLocalizations.of(context)!;

    switch (message) {
      // Network errors
      case ErrorKeys.connectionTimeout:
        return l10n.errorConnectionTimeout;
      case ErrorKeys.noInternet:
        return l10n.errorNoInternet;
      case ErrorKeys.requestCancelled:
        return l10n.errorRequestCancelled;
      case ErrorKeys.unknown:
        return l10n.errorUnknown;

      // Authentication errors
      case ErrorKeys.authFailed:
        return l10n.errorAuthFailed;

      // Server errors
      case ErrorKeys.server:
        return l10n.errorServer;

      // Validation errors
      case ErrorKeys.convIdEmpty:
        return l10n.errorConvIdEmpty;
      case ErrorKeys.imageFileNotExist:
        return l10n.errorImageFileNotExist;
      case ErrorKeys.invalidImageFormat:
        return l10n.errorInvalidImageFormat;

      // If it's not a known error key, return the original message
      default:
        return message;
    }
  }
}
