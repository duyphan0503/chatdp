import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';
import '../cubit/language_cubit.dart';

class LanguageSelector extends StatelessWidget {
  final bool isDarkBackground;

  const LanguageSelector({super.key, this.isDarkBackground = true});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LanguageCubit, Locale>(
      builder: (context, currentLocale) {
        final l10n = AppLocalizations.of(context)!;

        return PopupMenuButton<String>(
          tooltip: l10n.selectLanguage,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: Colors.white.withValues(alpha: 0.1),
              width: 1,
            ),
          ),
          color: const Color(0xFF1E1E2E), // Dark background matching app theme
          elevation: 8,
          offset: const Offset(0, 48),

          itemBuilder: (BuildContext context) {
            return [
              _buildMenuItem(
                context,
                'en',
                l10n.english,
                currentLocale.languageCode == 'en',
              ),
              _buildMenuItem(
                context,
                'vi',
                l10n.vietnamese,
                currentLocale.languageCode == 'vi',
              ),
            ];
          },
          onSelected: (String code) {
            context.read<LanguageCubit>().changeLanguage(code);
          },
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.fromBorderSide(
                BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLanguageCodeBadge(currentLocale.languageCode),
                const SizedBox(width: 8),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: Colors.white.withValues(alpha: 0.7),
                  size: 20,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageCodeBadge(String code) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: AppColors.splashNeonCyan.withValues(alpha: 0.2),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.splashNeonCyan.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        code.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: AppColors.splashNeonCyan,
        ),
      ),
    );
  }

  PopupMenuItem<String> _buildMenuItem(
    BuildContext context,
    String value,
    String label,
    bool isSelected,
  ) {
    return PopupMenuItem<String>(
      value: value,
      child: Row(
        children: [
          _buildLanguageCodeBadge(value),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? AppColors.splashNeonCyan : Colors.white,
              ),
            ),
          ),
          if (isSelected)
            const Icon(
              Icons.check_rounded,
              color: AppColors.splashNeonCyan,
              size: 18,
            ),
        ],
      ),
    );
  }
}
