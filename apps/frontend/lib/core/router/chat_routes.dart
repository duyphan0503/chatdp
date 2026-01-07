import 'package:go_router/go_router.dart';
import '../../features/chat/presentation/pages/chat_detail_page.dart';
import 'app_routes.dart';

List<RouteBase> chatRoutes() {
  return [
    GoRoute(
      path: AppRoutes.chatDetail,
      builder: (context, state) {
        final conversationId = state.pathParameters['id']!;
        final extra = state.extra as Map<String, dynamic>?;
        final title = extra?['title'] as String?;
        final avatarUrl = extra?['avatarUrl'] as String?;

        return ChatDetailPage(
          conversationId: conversationId,
          title: title,
          avatarUrl: avatarUrl,
        );
      },
    ),
  ];
}
