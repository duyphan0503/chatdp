import 'package:flutter/material.dart';
import 'core/utils/url_strategy_noop.dart'
    if (dart.library.js_util) 'package:flutter_web_plugins/url_strategy.dart';
import 'app.dart';
import 'core/di/injection.dart';

import 'core/config/env_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Use path URL strategy to remove '#' from web URLs (only affects Web)
  usePathUrlStrategy();

  await EnvConfig.init(); // Load .env before DI
  configureDependencies();
  runApp(const ChatApp());
}
