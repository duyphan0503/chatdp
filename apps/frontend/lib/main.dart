import 'package:flutter/material.dart';
import 'app.dart';
import 'core/di/injection.dart';

import 'core/config/env_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.init(); // Load .env before DI
  configureDependencies();
  runApp(const ChatApp());
}
