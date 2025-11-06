import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { Throttle } from '@nestjs/throttler';

function extractClientIp(req: any): string | null {
  // Prefer Cloudflare/Akamai headers when present
  const cf = req.headers?.['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.length > 0) return cf;
  const tci = req.headers?.['true-client-ip'];
  if (typeof tci === 'string' && tci.length > 0) return tci;
  // Fallback to standard X-Forwarded-For chain (left-most = client)
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
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
  async signup(@Body() body: SignupDto, @Req() req: any): Promise<AuthTokens> {
    return this.auth.signup(
      {
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      },
      { userAgent: req.headers['user-agent'] ?? null, ip: extractClientIp(req) },
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: any): Promise<AuthTokens> {
    return this.auth.login(
      { email: body.email, password: body.password },
      { userAgent: req.headers['user-agent'] ?? null, ip: extractClientIp(req) },
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshDto, @Req() req: any): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken, {
      userAgent: req.headers['user-agent'] ?? null,
      ip: extractClientIp(req),
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: RefreshDto, @Req() _req: any): Promise<{ success: true }> {
    await this.auth.logout(body.refreshToken);
    return { success: true } as const;
  }
}
