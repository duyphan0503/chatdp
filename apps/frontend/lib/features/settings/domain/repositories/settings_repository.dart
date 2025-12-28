abstract class SettingsRepository {
  Future<void> setLanguage(String languageCode);
  Future<String?> getLanguage();
  Future<void> setThemeMode(String themeMode);
  Future<String?> getThemeMode();
}
