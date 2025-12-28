class AppValidators {
  // ignore: deprecated_member_use
  static final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!_emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 chars';
    }
    return null;
  }

  static String? required(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? confirmPassword(
    String? value,
    String password, {
    String? fieldName,
  }) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Confirm Password'} is required';
    }
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  static String? otp(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (value.length != 6 || int.tryParse(value) == null) {
      return 'OTP must be 6 digits';
    }
    return null;
  }
}
