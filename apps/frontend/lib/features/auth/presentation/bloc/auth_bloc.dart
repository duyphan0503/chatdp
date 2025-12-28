import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import 'package:bloc_concurrency/bloc_concurrency.dart';

import '../../../../core/utils/app_logger.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';

part 'auth_event.dart';
part 'auth_state.dart';

@injectable
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested, transformer: droppable());
    on<AuthRegisterRequested>(
      _onAuthRegisterRequested,
      transformer: droppable(),
    );
    on<AuthVerifyOtpRequested>(
      _onAuthVerifyOtpRequested,
      transformer: droppable(),
    );
    on<AuthResendOtpRequested>(
      _onAuthResendOtpRequested,
      transformer: droppable(),
    );
    on<AuthForgotPasswordRequested>(
      _onAuthForgotPasswordRequested,
      transformer: droppable(),
    );
    on<AuthResetPasswordRequested>(
      _onAuthResetPasswordRequested,
      transformer: droppable(),
    );
    on<AuthGoogleLoginRequested>(
      _onAuthGoogleLoginRequested,
      transformer: droppable(),
    );
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    // Artificial delay to ensure Splash animation is seen
    await Future.delayed(const Duration(seconds: 2));

    try {
      final user = await _authRepository.checkAuth();
      if (user != null) {
        emit(Authenticated(user));
      } else {
        emit(Unauthenticated());
      }
    } catch (_) {
      emit(Unauthenticated());
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.login(event.email, event.password);
      emit(Authenticated(user));
    } catch (e, stackTrace) {
      AppLogger.error('Login failed for email: ${event.email}', e, stackTrace);
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAuthRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.register(
        name: event.name,
        email: event.email,
        password: event.password,
      );
      emit(Authenticated(user));
    } catch (e, stackTrace) {
      AppLogger.error(
        'Registration failed for email: ${event.email}',
        e,
        stackTrace,
      );
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAuthVerifyOtpRequested(
    AuthVerifyOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.verifyEmail(event.email, event.otp);
      emit(Authenticated(user));
    } catch (e, stackTrace) {
      AppLogger.error(
        'OTP verify failed for email: ${event.email}',
        e,
        stackTrace,
      );
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  String _getErrorMessage(Object error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please check your internet connection.';
        case DioExceptionType.connectionError:
          return 'No internet connection.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final serverMessage = error.response?.data['message'];

          if (statusCode == 401) {
            return 'invalidCredentials';
          } else if (statusCode == 409) {
            return 'emailAlreadyRegistered';
          } else if (statusCode == 400) {
            if (serverMessage != null && serverMessage.toString().isNotEmpty) {
              return serverMessage.toString();
            }
            return 'Invalid information provided.';
          } else if (statusCode == 404) {
            return 'User not found.';
          } else if (statusCode == 500) {
            return 'Server error. Please try again later.';
          }
          if (serverMessage != null) return serverMessage.toString();
          return 'Server returned an error: $statusCode';
        case DioExceptionType.cancel:
          return 'Request cancelled.';
        default:
          return 'Network error occurred. Please try again.';
      }
    }
    return error.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _authRepository.logout();
    emit(Unauthenticated());
  }

  Future<void> _onAuthResendOtpRequested(
    AuthResendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.resendVerificationEmail(event.email);
      emit(AuthOtpResent());
    } catch (e, stackTrace) {
      AppLogger.error(
        'Resend OTP failed for email: ${event.email}',
        e,
        stackTrace,
      );
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAuthForgotPasswordRequested(
    AuthForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.forgotPassword(event.email);
      emit(AuthPasswordResetEmailSent());
    } catch (e, stackTrace) {
      AppLogger.error(
        'Forgot password failed for email: ${event.email}',
        e,
        stackTrace,
      );
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAuthResetPasswordRequested(
    AuthResetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.resetPassword(
        event.email,
        event.otp,
        event.newPassword,
      );
      emit(AuthPasswordResetSuccess());
    } catch (e, stackTrace) {
      AppLogger.error(
        'Reset password failed for email: ${event.email}',
        e,
        stackTrace,
      );
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAuthGoogleLoginRequested(
    AuthGoogleLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.googleLogin();
      emit(Authenticated(user));
    } catch (e, stackTrace) {
      AppLogger.error('Google login failed', e, stackTrace);
      emit(AuthError(_getErrorMessage(e)));
    }
  }
}
