import 'dart:math';
import 'package:flutter/material.dart';

class BubbleBackground extends StatefulWidget {
  final Widget child;
  const BubbleBackground({super.key, required this.child});

  @override
  State<BubbleBackground> createState() => _BubbleBackgroundState();
}

class _BubbleBackgroundState extends State<BubbleBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Bubble> _bubbles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    // Initialize bubbles
    for (int i = 0; i < 15; i++) {
      _bubbles.add(_generateBubble());
    }
  }

  Bubble _generateBubble() {
    return Bubble(
      x: _random.nextDouble(), // 0.0 to 1.0
      y: _random.nextDouble(), // 0.0 to 1.0
      size: _random.nextDouble() * 30 + 10, // 10 to 40
      speed: _random.nextDouble() * 0.2 + 0.05,
      opacity: _random.nextDouble() * 0.15 + 0.05, // Subtle opacity
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: BubblePainter(_bubbles, _controller.value),
          child: widget.child,
        );
      },
    );
  }
}

class Bubble {
  double x;
  double y;
  double size;
  double speed;
  double opacity;

  Bubble({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.opacity,
  });
}

class BubblePainter extends CustomPainter {
  final List<Bubble> bubbles;
  final double progress;

  BubblePainter(this.bubbles, this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    for (var bubble in bubbles) {
      // Calculate animated Y position (moving up)
      // We use current bubble.y as an offset, and subtract progress * speed
      double dy = (bubble.y - progress * bubble.speed) % 1.0;
      if (dy < 0) dy += 1.0;

      // Draw bubble
      paint.color = Colors.white.withValues(alpha: bubble.opacity);
      canvas.drawCircle(
        Offset(bubble.x * size.width, dy * size.height),
        bubble.size,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant BubblePainter oldDelegate) => true;
}
