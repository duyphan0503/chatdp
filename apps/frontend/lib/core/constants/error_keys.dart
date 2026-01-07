/// Error message keys for localization
class ErrorKeys {
  ErrorKeys._();

  // Network errors
  static const String connectionTimeout = 'errorConnectionTimeout';
  static const String noInternet = 'errorNoInternet';
  static const String requestCancelled = 'errorRequestCancelled';
  static const String unknown = 'errorUnknown';

  // Authentication errors
  static const String authFailed = 'errorAuthFailed';

  // Server errors
  static const String server = 'errorServer';

  // Validation errors
  static const String convIdEmpty = 'errorConvIdEmpty';
  static const String imageFileNotExist = 'errorImageFileNotExist';
  static const String invalidImageFormat = 'errorInvalidImageFormat';
}
