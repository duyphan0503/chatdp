import 'dart:ui';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/repositories/settings_repository.dart';

@injectable
class LanguageCubit extends Cubit<Locale> {
  final SettingsRepository _settingsRepository;

  LanguageCubit(this._settingsRepository) : super(const Locale('en')) {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final languageCode = await _settingsRepository.getLanguage();
    if (languageCode != null) {
      emit(Locale(languageCode));
    }
  }

  Future<void> changeLanguage(String languageCode) async {
    await _settingsRepository.setLanguage(languageCode);
    emit(Locale(languageCode));
  }
}
