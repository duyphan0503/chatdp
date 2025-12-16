import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';

import '../widgets/bubble_background.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          // 1. Background
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
          // 2. Subtle Bubbles
          Positioned.fill(
            child: Opacity(
              opacity: 0.2,
              child: BubbleBackground(child: const SizedBox.expand()),
            ),
          ),
          // 3. Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.splashNeonCyan.withValues(
                            alpha: 0.1,
                          ),
                          border: Border.all(
                            color: AppColors.splashNeonCyan.withValues(
                              alpha: 0.5,
                            ),
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.lock_reset_rounded,
                          size: 48,
                          color: AppColors.splashNeonCyan,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Title
                      Text(
                        'Forgot Password',
                        style: GoogleFonts.orbitron(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Enter your email address and we will send you a code to reset your password.',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Colors.white70,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 48),

                      // Email Input
                      TextFormField(
                        controller: _emailController,
                        style: GoogleFonts.inter(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Email Address',
                          labelStyle: const TextStyle(color: Colors.white60),
                          prefixIcon: const Icon(
                            Icons.alternate_email_rounded,
                            color: Colors.white70,
                          ),
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.05),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.splashNeonCyan,
                            ),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: Colors.redAccent.withValues(alpha: 0.5),
                            ),
                          ),
                        ),
                        validator: (v) => (v?.isEmpty ?? true)
                            ? 'Email is required'
                            : null, // Add robust regex validater later
                      ),
                      const SizedBox(height: 32),

                      // Send Code Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: const LinearGradient(
                              colors: [
                                AppColors.splashNeonCyan,
                                AppColors.splashNeonPurple,
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.splashNeonCyan.withValues(
                                  alpha: 0.4,
                                ),
                                blurRadius: 20,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: () {
                              if (_formKey.currentState!.validate()) {
                                // Navigate to OTP
                                context.push(
                                  AppRoutes.otpVerification,
                                  extra: {
                                    'email': _emailController.text,
                                    'isResetPassword': true,
                                  },
                                );
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Text(
                              'SEND CODE',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
