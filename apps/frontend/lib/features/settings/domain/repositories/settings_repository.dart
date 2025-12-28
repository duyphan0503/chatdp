abstract class SettingsRepository {
  Future<void> setLanguage(String languageCode);
  Future<String?> getLanguage();
}
