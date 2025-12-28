import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pinput/pinput.dart';
import 'dart:async';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/bubble_background.dart';

/// Page for entering OTP code (Email Verification or Password Reset).
class OtpVerificationPage extends StatefulWidget {
  final String email;
  final bool isResetPassword;

  const OtpVerificationPage({
    super.key,
    required this.email,
    this.isResetPassword = false,
  });

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();
  final _formKey = GlobalKey<FormState>();
  Timer? _timer;
  int _start = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  void startTimer() {
    setState(() {
      _start = 60;
      _canResend = false;
    });
    const oneSec = Duration(seconds: 1);
    _timer = Timer.periodic(oneSec, (Timer timer) {
      if (_start == 0) {
        setState(() {
          timer.cancel();
          _canResend = true;
        });
      } else {
        setState(() {
          _start--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pinController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _submitOtp(String pin) {
    if (widget.isResetPassword) {
      context.push(
        AppRoutes.resetPassword,
        extra: {'email': widget.email, 'otp': pin},
      );
    } else {
      context.read<AuthBloc>().add(
        AuthVerifyOtpRequested(email: widget.email, otp: pin),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const focusedBorderColor = AppColors.splashNeonCyan;
    const fillColor = Color.fromRGBO(243, 246, 249, 0);
    final borderColor = Colors.white.withValues(alpha: 0.2);

    final defaultPinTheme = PinTheme(
      width: 56,
      height: 56,
      textStyle: GoogleFonts.inter(
        fontSize: 22,
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        color: fillColor, // Use the defined fillColor
      ),
    );

    /// Use AuthBloc for verifying OTP logic
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
          // 1. Background (Consistent with Login/Register)
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
                // If verification success (token received or next step)
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Verification Successful!'),
                    backgroundColor: Colors.green,
                  ),
                );
                context.go(AppRoutes.chat);
              } else if (state is AuthOtpResent) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('OTP sent successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );
              } else if (state is AuthError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            },
            builder: (context, state) {
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
                              Icons.mark_email_read_outlined,
                              size: 48,
                              color: AppColors.splashNeonCyan,
                            ),
                          ),
                          const SizedBox(height: 32),

                          // Title
                          Text(
                            widget.isResetPassword
                                ? 'Password Recovery'
                                : 'Verify Your Email',
                            style: GoogleFonts.orbitron(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Please enter the 6-digit code sent to\n${widget.email}',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.white70,
                              height: 1.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 48),

                          // Pinput Widget
                          Pinput(
                            controller: _pinController,
                            focusNode: _focusNode,
                            length: 6,
                            defaultPinTheme: defaultPinTheme,
                            focusedPinTheme: defaultPinTheme.copyWith(
                              decoration: defaultPinTheme.decoration!.copyWith(
                                border: Border.all(color: focusedBorderColor),
                                boxShadow: [
                                  BoxShadow(
                                    color: focusedBorderColor.withValues(
                                      alpha: 0.3,
                                    ),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                            submittedPinTheme: defaultPinTheme.copyWith(
                              decoration: defaultPinTheme.decoration!.copyWith(
                                color: focusedBorderColor.withValues(
                                  alpha: 0.1,
                                ),
                                border: Border.all(color: focusedBorderColor),
                              ),
                            ),
                            validator: (s) {
                              return s != null && s.length == 6
                                  ? null
                                  : 'Please enter 6 digits';
                            },
                            pinputAutovalidateMode:
                                PinputAutovalidateMode.onSubmit,
                            showCursor: true,
                            onCompleted: (pin) {
                              _submitOtp(pin);
                            },
                          ),

                          const SizedBox(height: 40),

                          // Timer / Resend
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Didn't receive the code? ",
                                style: GoogleFonts.inter(
                                  color: Colors.white60,
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: _canResend
                                    ? () {
                                        context.read<AuthBloc>().add(
                                          AuthResendOtpRequested(widget.email),
                                        );
                                        startTimer();
                                      }
                                    : null,
                                child: Text(
                                  _canResend ? "Resend" : "Resend in $_start s",
                                  style: GoogleFonts.inter(
                                    color: _canResend
                                        ? AppColors.splashNeonCyan
                                        : Colors.white38,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 32),

                          // Verify Button
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
                                onPressed: state is AuthLoading
                                    ? null
                                    : () {
                                        if (_formKey.currentState!.validate()) {
                                          _submitOtp(_pinController.text);
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
                                        'VERIFY',
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
              );
            },
          ),
        ],
      ),
    );
  }
}
