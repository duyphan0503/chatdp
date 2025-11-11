import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: RefreshDto): Promise<{ success: true }> {
    await this.auth.logout(body.refreshToken);
    return { success: true } as const;
  }
}
