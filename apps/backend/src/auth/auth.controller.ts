import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

function headerValue(val: string | string[] | undefined): string | null {
  if (typeof val === 'string' && val.length > 0) return val;
  if (Array.isArray(val) && typeof val[0] === 'string' && val[0].length > 0) return val[0];
  return null;
}

function extractClientIp(req: Request): string | null {
  // Prefer Cloudflare/Akamai headers when present
  const cf = headerValue(req.headers['cf-connecting-ip']);
  if (cf) return cf;
  const tci = headerValue(req.headers['true-client-ip']);
  if (tci) return tci;
  // Fallback to standard X-Forwarded-For chain (left-most = client)
  const xff = headerValue(req.headers['x-forwarded-for']);
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  // Finally, use Express-detected IP
  return req.ip ?? null;
}

/**
 * HTTP endpoints for user authentication and token management.
 *
 * Exposes signup, login, refresh and logout flows. Each handler enriches
 * the call with user agent and client IP metadata when available so that
 * refresh token binding and audit logic in AuthService can make decisions.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Registers a new user account and issues initial access/refresh tokens.
   *
   * @param body Validated signup payload including email, password and display name.
   * @param req Incoming HTTP request used to extract user agent and client IP.
   */
  @Post('signup')
  async signup(@Body() body: SignupDto, @Req() req: Request): Promise<AuthTokens> {
    const ua = headerValue(req.headers['user-agent']);
    return this.auth.signup(
      {
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      },
      { userAgent: ua, ip: extractClientIp(req) },
    );
  }

  /**
   * Authenticates a user by email and password and returns JWT access/refresh
   * tokens. Rate limited to mitigate brute-force attempts.
   *
   * @param body Login credentials.
   * @param req HTTP request used to extract user agent and client IP.
   */
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request): Promise<AuthTokens> {
    const ua = headerValue(req.headers['user-agent']);
    return this.auth.login(
      { email: body.email, password: body.password },
      { userAgent: ua, ip: extractClientIp(req) },
    );
  }

  /**
   * Authenticates a user via Google ID Token.
   *
   * @param body Google Login DTO containing the ID Token.
   * @param req HTTP request used to extract user agent and client IP.
   */
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() body: GoogleLoginDto, @Req() req: Request): Promise<AuthTokens> {
    const ua = headerValue(req.headers['user-agent']);
    return this.auth.googleLogin(body.token, {
      userAgent: ua,
      ip: extractClientIp(req),
    });
  }

  /**
   * Rotates a valid refresh token and returns a fresh access/refresh pair.
   *
   * Binding checks (user agent, IP) are delegated to AuthService based on
   * configuration. Rate limited to protect against abuse.
   */
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshDto, @Req() req: Request): Promise<AuthTokens> {
    const ua = headerValue(req.headers['user-agent']);
    return this.auth.refresh(body.refreshToken, {
      userAgent: ua,
      ip: extractClientIp(req),
    });
  }

  /**
   * Revokes a refresh token if it is still active and returns a success flag.
   *
   * The endpoint is intentionally idempotent and does not reveal whether the
   * provided token was valid or already revoked.
   */
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: RefreshDto): Promise<{ success: true }> {
    await this.auth.logout(body.refreshToken);
    return { success: true } as const;
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-verification')
  async sendVerification(@Req() req: Request & { user?: { id: string } }): Promise<void> {
    // Requires AuthGuard to populate valid user
    if (req.user?.id) {
      await this.auth.sendVerificationEmail(req.user.id);
    }
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: ForgotPasswordDto): Promise<void> {
    // Reusing ForgotPasswordDto which just has 'email'
    const user = await this.auth.findUserByEmail(body.email);
    if (user) {
      await this.auth.sendVerificationEmail(user.id);
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<{ success: boolean }> {
    return this.auth.verifyEmail(body);
  }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<void> {
    return this.auth.forgotPassword(body.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<{ success: boolean }> {
    return this.auth.resetPassword(body);
  }
}
