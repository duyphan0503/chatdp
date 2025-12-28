import 'package:injectable/injectable.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_local_data_source.dart';

@LazySingleton(as: SettingsRepository)
class SettingsRepositoryImpl implements SettingsRepository {
  final SettingsLocalDataSource _localDataSource;

  SettingsRepositoryImpl(this._localDataSource);

  @override
  Future<String?> getLanguage() => _localDataSource.getCachedLanguageCode();

  @override
  Future<void> setLanguage(String languageCode) =>
      _localDataSource.cacheLanguageCode(languageCode);
}
