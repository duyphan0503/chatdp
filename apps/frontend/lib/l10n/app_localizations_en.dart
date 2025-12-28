// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'ChatDP';

  @override
  String get loginTitle => 'Welcome Back';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get signIn => 'SIGN IN';

  @override
  String get forgotPassword => 'Forgot Password?';

  @override
  String get orContinueWith => 'Or continue with';

  @override
  String get dontHaveAccount => 'Don\'t have an account? ';

  @override
  String inputRequired(Object field) {
    return '$field is required';
  }

  @override
  String get invalidEmail => 'Please enter a valid email';

  @override
  String get passwordTooShort => 'Password must be at least 6 chars';

  @override
  String get passwordsDoNotMatch => 'Passwords do not match';

  @override
  String get nameTooShort => 'Name must be at least 2 characters';

  @override
  String get otpInvalid => 'OTP must be 6 digits';

  @override
  String get loginSuccess => 'Login Successful! Welcome back.';

  @override
  String get verifyEmailToContinue => 'Please verify your email to continue.';

  @override
  String get resetPasswordSuccess =>
      'Password Reset Successfully! Please login with new password.';

  @override
  String get verificationCodeSent => 'Verification code sent successfully!';

  @override
  String get otpSentSuccess => 'OTP sent successfully!';

  @override
  String get verificationSuccess => 'Verification Successful!';

  @override
  String get registrationSuccess => 'Registration Successful!';

  @override
  String get signInToContinue => 'Sign in to continue';

  @override
  String get createAccount => 'Create Account';

  @override
  String get joinFuture => 'Join the future of messaging';

  @override
  String get fullName => 'Full Name';

  @override
  String get confirmPassword => 'Confirm Password';

  @override
  String get signUp => 'SIGN UP';

  @override
  String get alreadyHaveAccount => 'Already have an account? ';

  @override
  String get signInAction => 'Sign In';

  @override
  String get passwordRecovery => 'Password Recovery';

  @override
  String get verifyYourEmail => 'Verify Your Email';

  @override
  String enterOtpCodes(Object email) {
    return 'Please enter the 6-digit code sent to\n$email';
  }

  @override
  String get otpInputHint => 'Please enter 6 digits';

  @override
  String get didntReceiveCode => 'Didn\'t receive the code? ';

  @override
  String get resend => 'Resend';

  @override
  String resendIn(Object start) {
    return 'Resend in $start s';
  }

  @override
  String get verify => 'VERIFY';

  @override
  String get forgotPasswordTitle => 'Forgot Password';

  @override
  String get forgotPasswordInstruction =>
      'Enter your email address and we will send you a code to reset your password.';

  @override
  String get emailAddress => 'Email Address';

  @override
  String get sendCode => 'SEND CODE';

  @override
  String get setNewPassword => 'Set New Password';

  @override
  String get newPasswordInstruction =>
      'Your new password must be different from previously used passwords.';

  @override
  String get newPassword => 'New Password';

  @override
  String get resetPassword => 'RESET PASSWORD';

  @override
  String get google => 'Google';

  @override
  String get apple => 'Apple';

  @override
  String get comingSoon => 'Coming Soon';

  @override
  String get rememberMe => 'Remember Me';

  @override
  String get navChat => 'Chat';

  @override
  String get navSettings => 'Settings';

  @override
  String get chatListTitle => 'Chats';

  @override
  String get chatListPlaceholder => 'Chat list will be here';

  @override
  String get language => 'Language';

  @override
  String get selectLanguage => 'Select Language';

  @override
  String get english => 'English';

  @override
  String get vietnamese => 'Tiếng Việt';
}
