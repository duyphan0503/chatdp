import 'package:go_router/go_router.dart';

import '../../features/chat/presentation/pages/chat_list_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/shell/presentation/pages/app_shell_page.dart';
import 'app_routes.dart';

List<RouteBase> shellRoutes() {
  return [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          AppShellPage(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.chat,
              builder: (context, state) => const ChatListPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.settings,
              builder: (context, state) => const SettingsPage(),
            ),
          ],
        ),
      ],
    ),
  ];
}
