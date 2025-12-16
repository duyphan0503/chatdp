import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../gen/assets.gen.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/bubble_background.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<AuthBloc>(),
      child: Scaffold(
        body: Stack(
          children: [
            // 1. Background (Consistent with Splash)
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
            BlocConsumer<AuthBloc, AuthState>(
              listener: (context, state) {
                if (state is Authenticated) {
                  // Show Success Message
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Login Successful! Welcome back.'),
                      backgroundColor: Colors.green,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  // Navigate to Home/Chat
                  context.go(AppRoutes.chat);
                } else if (state is AuthError) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(state.message),
                      backgroundColor: Colors.redAccent,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              builder: (context, state) {
                return LayoutBuilder(
                  builder: (context, constraints) {
                    return Center(
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
                                // Logo
                                Center(
                                  child: Hero(
                                    tag: 'app_logo',
                                    child: Assets.logoTransparent.image(
                                      width: 120,
                                      height: 120,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Title
                                Center(
                                  child: Column(
                                    children: [
                                      Text(
                                        'Welcome Back',
                                        style: GoogleFonts.orbitron(
                                          fontSize: 28,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          letterSpacing: 1.5,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Sign in to continue',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: Colors.white70,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 48),

                                // Email Input
                                _buildTextField(
                                  controller: _emailController,
                                  label: 'Email',
                                  icon: Icons.alternate_email_rounded,
                                  validator: (v) => (v?.isEmpty ?? true)
                                      ? 'Email is required'
                                      : null,
                                ),
                                const SizedBox(height: 20),

                                // Password Input
                                _buildTextField(
                                  controller: _passwordController,
                                  label: 'Password',
                                  icon: Icons.lock_outline_rounded,
                                  isPassword: true,
                                  validator: (v) => (v?.isEmpty ?? true)
                                      ? 'Password is required'
                                      : null,
                                ),

                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {
                                      context.push(AppRoutes.forgotPassword);
                                    },
                                    child: Text(
                                      'Forgot Password?',
                                      style: GoogleFonts.inter(
                                        color: AppColors.splashNeonCyan,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 32),

                                // Login Button
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
                                          color: AppColors.splashNeonCyan
                                              .withValues(alpha: 0.4),
                                          blurRadius: 20,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ElevatedButton(
                                      onPressed: state is AuthLoading
                                          ? null
                                          : () {
                                              if (_formKey.currentState!
                                                  .validate()) {
                                                context.read<AuthBloc>().add(
                                                  AuthLoginRequested(
                                                    _emailController.text,
                                                    _passwordController.text,
                                                  ),
                                                );
                                              }
                                            },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                        ),
                                      ),
                                      child: state is AuthLoading
                                          ? const CircularProgressIndicator(
                                              color: Colors.white,
                                            )
                                          : Text(
                                              'SIGN IN',
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
                                const SizedBox(height: 16),

                                // Remember Me Row
                                Row(
                                  children: [
                                    Checkbox(
                                      value: true, // TODO: state
                                      activeColor: AppColors.splashNeonCyan,
                                      checkColor: Colors.black,
                                      side: const BorderSide(
                                        color: Colors.white60,
                                      ),
                                      onChanged: (val) {},
                                    ),
                                    Text(
                                      'Remember Me',
                                      style: GoogleFonts.inter(
                                        color: Colors.white70,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 32),

                                // Divider
                                Row(
                                  children: [
                                    Expanded(
                                      child: Container(
                                        height: 1,
                                        color: Colors.white.withValues(
                                          alpha: 0.1,
                                        ),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                      ),
                                      child: Text(
                                        'Or continue with',
                                        style: GoogleFonts.inter(
                                          color: Colors.white38,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      child: Container(
                                        height: 1,
                                        color: Colors.white.withValues(
                                          alpha: 0.1,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),

                                // Social Buttons
                                Wrap(
                                  alignment: WrapAlignment.center,
                                  spacing: 20,
                                  runSpacing: 20,
                                  children: [
                                    _buildSocialButton(
                                      icon: Icons.g_mobiledata,
                                      label: 'Google',
                                      onTap: () {},
                                    ),
                                    _buildSocialButton(
                                      icon: Icons.apple,
                                      label: 'Apple',
                                      onTap: () {},
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 48),

                                // Register Link
                                Wrap(
                                  alignment: WrapAlignment.center,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Text(
                                      "Don't have an account? ",
                                      style: GoogleFonts.inter(
                                        color: Colors.white70,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        context.go(AppRoutes.register);
                                      },
                                      child: Text(
                                        'Sign Up',
                                        style: GoogleFonts.inter(
                                          color: AppColors.splashNeonCyan,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
    String? Function(String?)? validator,
  }) {
    return _PasswordAwareTextField(
      controller: controller,
      label: label,
      icon: icon,
      isPassword: isPassword,
      validator: validator,
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 140, // Fixed width for buttons
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PasswordAwareTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool isPassword;
  final String? Function(String?)? validator;

  const _PasswordAwareTextField({
    required this.controller,
    required this.label,
    required this.icon,
    required this.isPassword,
    this.validator,
  });

  @override
  State<_PasswordAwareTextField> createState() =>
      _PasswordAwareTextFieldState();
}

class _PasswordAwareTextFieldState extends State<_PasswordAwareTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.isPassword;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: widget.isPassword ? _obscureText : false,
      style: GoogleFonts.inter(color: Colors.white),
      decoration: InputDecoration(
        labelText: widget.label,
        labelStyle: const TextStyle(color: Colors.white60),
        prefixIcon: Icon(widget.icon, color: Colors.white70),
        suffixIcon: widget.isPassword
            ? IconButton(
                icon: Icon(
                  _obscureText
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: Colors.white60,
                ),
                onPressed: () {
                  setState(() {
                    _obscureText = !_obscureText;
                  });
                },
              )
            : null,
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.splashNeonCyan),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: Colors.redAccent.withValues(alpha: 0.5),
          ),
        ),
      ),
      validator: widget.validator,
    );
  }
}
