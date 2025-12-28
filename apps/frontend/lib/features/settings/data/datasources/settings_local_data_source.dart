import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

abstract class SettingsLocalDataSource {
  Future<void> cacheLanguageCode(String languageCode);
  Future<String?> getCachedLanguageCode();
  Future<void> cacheThemeMode(String themeMode);
  Future<String?> getCachedThemeMode();
}

@LazySingleton(as: SettingsLocalDataSource)
class SettingsLocalDataSourceImpl implements SettingsLocalDataSource {
  final SharedPreferences _sharedPreferences;

  SettingsLocalDataSourceImpl(this._sharedPreferences);

  static const _cachedLanguageCodeKey = 'CACHED_LANGUAGE_CODE';
  static const _cachedThemeModeKey = 'CACHED_THEME_MODE';

  @override
  Future<void> cacheLanguageCode(String languageCode) {
    return _sharedPreferences.setString(_cachedLanguageCodeKey, languageCode);
  }

  @override
  Future<String?> getCachedLanguageCode() async {
    return _sharedPreferences.getString(_cachedLanguageCodeKey);
  }

  @override
  Future<void> cacheThemeMode(String themeMode) {
    return _sharedPreferences.setString(_cachedThemeModeKey, themeMode);
  }

  @override
  Future<String?> getCachedThemeMode() async {
    return _sharedPreferences.getString(_cachedThemeModeKey);
  }
}
