import 'package:go_router/go_router.dart';

import 'app_routes.dart';
import 'auth_routes.dart';
import 'shell_routes.dart';

import 'chat_routes.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: AppRoutes.splash,
    routes: [...authRoutes(), ...shellRoutes(), ...chatRoutes()],
  );
}
