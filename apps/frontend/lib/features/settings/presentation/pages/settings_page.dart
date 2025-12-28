import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../l10n/app_localizations.dart';
import '../cubit/language_cubit.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.navSettings)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              l10n.selectLanguage,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                context.read<LanguageCubit>().changeLanguage('en');
              },
              child: Text(l10n.english),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                context.read<LanguageCubit>().changeLanguage('vi');
              },
              child: Text(l10n.vietnamese),
            ),
          ],
        ),
      ),
    );
  }
}
