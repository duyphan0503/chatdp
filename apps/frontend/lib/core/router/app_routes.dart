class AppRoutes {
  const AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String chat = '/chat';
  static const String chatDetail = '/chat/:id';
  static const String newChat = 'new-chat';
  static const String settings = '/settings';

  // Auth
  static const String register = '/register';
  static const String otpVerification = '/otp-verification';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
}
