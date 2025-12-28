import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/validators.dart';
import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../gen/assets.gen.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/bubble_background.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Background (Consistent with Login)
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
                if (!state.user.isEmailVerified) {
                  context.push(
                    AppRoutes.otpVerification,
                    extra: {'email': state.user.email},
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Registration Successful!'),
                      backgroundColor: Colors.green,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  context.go(AppRoutes.chat);
                }
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
                                    width: 100,
                                    height: 100,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Title
                              Center(
                                child: Column(
                                  children: [
                                    Text(
                                      'Create Account',
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
                                      'Join the future of messaging',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.white70,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 32),

                              // Name Input
                              _buildTextField(
                                controller: _nameController,
                                label: 'Full Name',
                                icon: Icons.person_outline_rounded,
                                validator: (v) =>
                                    AppValidators.required(v, 'Full Name'),
                              ),
                              const SizedBox(height: 16),

                              // Email Input
                              _buildTextField(
                                controller: _emailController,
                                label: 'Email',
                                icon: Icons.alternate_email_rounded,
                                validator: AppValidators.email,
                              ),
                              const SizedBox(height: 16),

                              // Password Input
                              _buildTextField(
                                controller: _passwordController,
                                label: 'Password',
                                icon: Icons.lock_outline_rounded,
                                isPassword: true,
                                validator: AppValidators.password,
                              ),
                              const SizedBox(height: 16),

                              // Confirm Password Input
                              _buildTextField(
                                controller: _confirmPasswordController,
                                label: 'Confirm Password',
                                icon: Icons.lock_clock_outlined,
                                isPassword: true,
                                validator: (v) => AppValidators.confirmPassword(
                                  v,
                                  _passwordController.text,
                                ),
                              ),

                              const SizedBox(height: 32),

                              // Register Button
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
                                                AuthRegisterRequested(
                                                  email: _emailController.text,
                                                  password:
                                                      _passwordController.text,
                                                  name: _nameController.text,
                                                ),
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
                                    child: state is AuthLoading
                                        ? const CircularProgressIndicator(
                                            color: Colors.white,
                                          )
                                        : Text(
                                            'SIGN UP',
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

                              const SizedBox(height: 32),

                              // Back to Login
                              Wrap(
                                alignment: WrapAlignment.center,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text(
                                    "Already have an account? ",
                                    style: GoogleFonts.inter(
                                      color: Colors.white70,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      context.go(AppRoutes.login);
                                    },
                                    child: Text(
                                      'Sign In',
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
