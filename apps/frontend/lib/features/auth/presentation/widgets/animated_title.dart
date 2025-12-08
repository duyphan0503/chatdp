import 'package:flutter/material.dart';

/// Animated text with a "neon snake" highlight running along the border.
/// A bright neon segment travels around the outline over time while
/// the base fill and base stroke remain visible and readable.
class AnimatedGradientText extends StatefulWidget {
  final String text;
  final TextStyle? style;
  final double strokeWidth;

  const AnimatedGradientText({
    super.key,
    required this.text,
    this.style,
    this.strokeWidth = 3.0,
  });

  @override
  State<AnimatedGradientText> createState() => _AnimatedGradientTextState();
}

class _AnimatedGradientTextState extends State<AnimatedGradientText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final baseStyle = DefaultTextStyle.of(context).style.merge(widget.style);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // Compute base neon stroke color (always visible border).
        const baseNeonColor = Color(0xFF00E5FF); // neon cyan

        return Stack(
          children: [
            // Solid white fill for readability.
            Text(widget.text, style: baseStyle.copyWith(color: Colors.white)),
            // Base neon stroke so the outline is always visible.
            Text(
              widget.text,
              style: baseStyle.copyWith(
                foreground: Paint()
                  ..style = PaintingStyle.stroke
                  ..strokeWidth = widget.strokeWidth
                  ..color = baseNeonColor.withValues(alpha: 0.5),
              ),
            ),
            // Moving neon "snake" highlight along the stroke.
            ShaderMask(
              shaderCallback: (bounds) {
                // Creates a "traveling light" effect (Neon Snake)
                // The gradient is a short segment that moves from left to right.

                // Calculate the current position of the segment center (-1.0 to 2.0 to ensure full transit)
                final position = -1.5 + (_controller.value * 3.5);
                const segmentWidth = 0.4; // Width of the visible neon segment

                return LinearGradient(
                  colors: const [
                    Colors.transparent,
                    Color(0xFF00E5FF), // Head (Cyan)
                    Color(0xFFAA00FF), // Body (Purple)
                    Color(0xFF00E5FF), // Tail (Cyan)
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
                  // Defines the direction and size of the gradient window
                  begin: Alignment(position - segmentWidth, 0.5),
                  end: Alignment(position + segmentWidth, 0.5),
                  tileMode: TileMode.clamp,
                ).createShader(bounds);
              },
              blendMode: BlendMode.srcIn,
              child: Text(
                widget.text,
                style: baseStyle.copyWith(
                  foreground: Paint()
                    ..style = PaintingStyle.stroke
                    ..strokeWidth = widget.strokeWidth
                    ..color = Colors.white,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
