import 'package:flutter/widgets.dart';
import '../../l10n/app_localizations.dart';

class AppValidators {
  // ignore: deprecated_member_use
  static final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  static String? email(BuildContext context, String? value) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.inputRequired(l10n.email);
    }
    if (!_emailRegex.hasMatch(value)) {
      return l10n.invalidEmail;
    }
    return null;
  }

  static String? password(BuildContext context, String? value) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.inputRequired(l10n.password);
    }
    if (value.length < 6) {
      return l10n.passwordTooShort;
    }
    return null;
  }

  static String? required(
    BuildContext context,
    String? value,
    String fieldName,
  ) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.inputRequired(fieldName);
    }
    return null;
  }

  static String? confirmPassword(
    BuildContext context,
    String? value,
    String password, {
    String? fieldName,
  }) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.inputRequired(fieldName ?? 'Confirm Password');
    }
    if (value != password) {
      return l10n.passwordsDoNotMatch;
    }
    return null;
  }

  static String? name(BuildContext context, String? value) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.trim().isEmpty) {
      // Assuming 'Name' is not in l10n yet, using hardcoded fallback or we should add 'Name' key.
      // For now using 'Name' string, ideally should be l10n.name
      return l10n.inputRequired('Name');
    }
    if (value.trim().length < 2) {
      return l10n.nameTooShort;
    }
    return null;
  }

  static String? otp(BuildContext context, String? value) {
    final l10n = AppLocalizations.of(context)!;
    if (value == null || value.isEmpty) {
      return l10n.inputRequired('OTP');
    }
    if (value.length != 6 || int.tryParse(value) == null) {
      return l10n.otpInvalid;
    }
    return null;
  }
}
