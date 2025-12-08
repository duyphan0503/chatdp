import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

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
    // Simple timed navigation placeholder until auth flow is ready.
    Future<void>.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      context.go('/login');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                colors: [
                  Color(0xFF202B48), // Deep Navy Center
                  Color(0xFF000000), // Pure Black Edges
                ],
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
                        color: const Color(0xFF00E5FF).withValues(alpha: 0.3),
                        blurRadius: 60,
                        spreadRadius: 10,
                      ),
                      BoxShadow(
                        color: const Color(0xFFAA00FF).withValues(alpha: 0.2),
                        blurRadius: 40,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Image.asset(
                    'assets/logo_transparent.png',
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
    );
  }
}
