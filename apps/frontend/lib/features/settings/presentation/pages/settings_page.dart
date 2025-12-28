import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../l10n/app_localizations.dart';
import '../cubit/language_cubit.dart';
import '../cubit/theme_cubit.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.navSettings), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _buildSectionHeader(context, l10n.language),
          _buildLanguageSelector(context, l10n),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Divider(),
          ),
          _buildSectionHeader(context, l10n.themeMode),
          _buildThemeSelector(context, l10n),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildLanguageSelector(BuildContext context, AppLocalizations l10n) {
    return BlocBuilder<LanguageCubit, Locale>(
      builder: (context, locale) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SegmentedButton<String>(
            segments: [
              ButtonSegment<String>(
                value: 'en',
                label: Text(l10n.english),
                icon: const Icon(Icons.language),
              ),
              ButtonSegment<String>(
                value: 'vi',
                label: Text(l10n.vietnamese),
                icon: const Icon(Icons.translate),
              ),
            ],
            selected: {locale.languageCode},
            onSelectionChanged: (Set<String> newSelection) {
              context.read<LanguageCubit>().changeLanguage(newSelection.first);
            },
          ),
        );
      },
    );
  }

  Widget _buildThemeSelector(BuildContext context, AppLocalizations l10n) {
    return BlocBuilder<ThemeCubit, ThemeMode>(
      builder: (context, themeMode) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SegmentedButton<ThemeMode>(
            segments: [
              ButtonSegment<ThemeMode>(
                value: ThemeMode.system,
                label: Text(l10n.themeSystem),
                icon: const Icon(Icons.brightness_auto),
              ),
              ButtonSegment<ThemeMode>(
                value: ThemeMode.light,
                label: Text(l10n.themeLight),
                icon: const Icon(Icons.light_mode),
              ),
              ButtonSegment<ThemeMode>(
                value: ThemeMode.dark,
                label: Text(l10n.themeDark),
                icon: const Icon(Icons.dark_mode),
              ),
            ],
            selected: {themeMode},
            onSelectionChanged: (Set<ThemeMode> newSelection) {
              context.read<ThemeCubit>().changeTheme(newSelection.first);
            },
          ),
        );
      },
    );
  }
}
