import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:frontend/gen/assets.gen.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/bubble_background.dart';
import '../widgets/animated_title.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    // Dispatch auth check event
    context.read<AuthBloc>().add(const AuthCheckRequested());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is Authenticated) {
          context.go(AppRoutes.chat);
        } else if (state is Unauthenticated) {
          context.go(AppRoutes.login);
        }
      },
      child: Scaffold(
        body: Stack(
          children: [
            // 1. Background Layer (Deep Void Gradient)
            Container(
              width: double.infinity,
              height: double.infinity,
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.5,
                  colors: [AppColors.splashInner, AppColors.splashOuter],
                  stops: [0.0, 1.0],
                ),
              ),
            ),
            // 2. Bubble Pattern Layer (Reduced Opacity)
            Positioned.fill(
              child: Opacity(
                opacity: 0.3, // Make bubbles subtle so they don't compete
                child: BubbleBackground(child: const SizedBox.expand()),
              ),
            ),
            // 3. Foreground Content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  // Logo with glow
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.splashNeonCyan.withValues(
                            alpha: 0.3,
                          ),
                          blurRadius: 60,
                          spreadRadius: 10,
                        ),
                        BoxShadow(
                          color: AppColors.splashNeonPurple.withValues(
                            alpha: 0.2,
                          ),
                          blurRadius: 40,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: Assets.logoTransparent.image(
                      width: 220,
                      height: 220,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // App name with neon border effect
                  AnimatedGradientText(
                    text: 'ChatDP',
                    strokeWidth: 2.0,
                    style: GoogleFonts.shrikhand(
                      fontSize: 80,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const Spacer(),
                  const CircularProgressIndicator(color: Colors.white),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
