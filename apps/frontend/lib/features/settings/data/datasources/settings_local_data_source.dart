import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

abstract class SettingsLocalDataSource {
  Future<void> cacheLanguageCode(String languageCode);
  Future<String?> getCachedLanguageCode();
}

@LazySingleton(as: SettingsLocalDataSource)
class SettingsLocalDataSourceImpl implements SettingsLocalDataSource {
  final SharedPreferences _sharedPreferences;

  SettingsLocalDataSourceImpl(this._sharedPreferences);

  static const _cachedLanguageCodeKey = 'CACHED_LANGUAGE_CODE';

  @override
  Future<void> cacheLanguageCode(String languageCode) {
    return _sharedPreferences.setString(_cachedLanguageCodeKey, languageCode);
  }

  @override
  Future<String?> getCachedLanguageCode() async {
    return _sharedPreferences.getString(_cachedLanguageCodeKey);
  }
}
