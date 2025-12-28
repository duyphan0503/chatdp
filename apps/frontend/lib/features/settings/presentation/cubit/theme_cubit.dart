import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/repositories/settings_repository.dart';

@injectable
class ThemeCubit extends Cubit<ThemeMode> {
  final SettingsRepository _settingsRepository;

  ThemeCubit(this._settingsRepository) : super(ThemeMode.system) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final themeName = await _settingsRepository.getThemeMode();
    if (themeName != null) {
      final mode = ThemeMode.values.firstWhere(
        (e) => e.name == themeName,
        orElse: () => ThemeMode.system,
      );
      emit(mode);
    }
  }

  Future<void> changeTheme(ThemeMode mode) async {
    await _settingsRepository.setThemeMode(mode.name);
    emit(mode);
  }
}
