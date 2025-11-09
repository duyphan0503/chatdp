import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';
import { UserRepository, UserRecord } from '../repositories/user.repository.js';
import {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from '../repositories/refresh-token.repository.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
  };
}

type RefreshContext = { userAgent?: string | null; ip?: string | null };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async signup(
    params: {
      email: string;
      password: string;
      displayName: string;
    },
    ctx?: RefreshContext,
  ): Promise<AuthTokens> {
    const existing = params.email ? await this.users.findByEmail(params.email) : null;
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(params.password);
    const user = await this.users.create({
      email: params.email,
      passwordHash,
      displayName: params.displayName,
    });
    return this.issueTokens(user, ctx);
  }

  async login(
    params: { email: string; password: string },
    ctx?: RefreshContext,
  ): Promise<AuthTokens> {
    const user = params.email ? await this.users.findByEmail(params.email) : null;
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.passwordHash, params.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user, ctx);
  }

  async refresh(refreshToken: string, ctx?: RefreshContext): Promise<AuthTokens> {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      // Differentiate server misconfiguration clearly
      throw new UnauthorizedException('server_misconfigured');
    }

    // Only the JWT verification is wrapped to normalize invalid token errors
    let payload: { sub: string; jti: string; email?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; jti: string; email?: string }>(
        refreshToken,
        { secret },
      );
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token');

    // Validate refresh token against DB (hashed)
    const stored = await this.refreshTokens.findById(payload.jti);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid token');
    }

    const valid = await argon2.verify(stored.tokenHash, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid token');

    // Enforce UA/IP binding when enabled and data available
    this.enforceBinding(stored, ctx);

    // Rotate: revoke old and issue new
    await this.refreshTokens.revoke(stored.id);
    return this.issueTokens(user, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      // Fail fast but do not leak internal configuration details beyond a predictable code path
      throw new UnauthorizedException('server_misconfigured');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(refreshToken, { secret });
      const stored = await this.refreshTokens.findById(payload.jti);
      if (stored && !stored.revokedAt) {
        await this.refreshTokens.revoke(stored.id);
      }
    } catch {
      // ignore to make logout idempotent and not reveal token validity
    }
  }

  private getBoolean(name: string, defaultVal: boolean): boolean {
    const raw = this.config.get<string>(name);
    if (raw === undefined || raw === null) return defaultVal;
    const val = String(raw).trim().toLowerCase();
    return val === '1' || val === 'true' || val === 'yes' || val === 'on';
  }

  private enforceBinding(stored: RefreshTokenRecord, ctx?: RefreshContext): void {
    // Granular binding config
    const bindBoth = this.getBoolean('REFRESH_BIND_UA_IP', true);
    const bindUA = this.getBoolean('REFRESH_BIND_UA', bindBoth);
    const bindIP = this.getBoolean('REFRESH_BIND_IP', bindBoth);
    if (!bindUA && !bindIP) return;
    // Only enforce for fields present in both stored and ctx
    if (bindUA && stored.userAgent && ctx?.userAgent && stored.userAgent !== ctx.userAgent) {
      throw new UnauthorizedException('Invalid token');
    }
    if (bindIP && stored.ip && ctx?.ip && stored.ip !== ctx.ip) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async issueTokens(user: UserRecord, ctx?: RefreshContext): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email ?? undefined,
      displayName: user.displayName,
      typ: 'access',
    });

    const refreshTtl = this.config.get<string>('REFRESH_TOKEN_TTL') ?? '7d';
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('server_misconfigured');
    }

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email ?? undefined,
        typ: 'refresh',
        jti,
      },
      { secret, expiresIn: refreshTtl },
    );

    // Persist hashed refresh token with expiry
    const expiresAt = this.computeExpiry(refreshTtl);
    const tokenHash = await argon2.hash(refreshToken);
    await this.refreshTokens.create({
      id: jti,
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: ctx?.userAgent ?? null,
      ip: ctx?.ip ?? null,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  private computeExpiry(ttl: string): Date {
    // Supports s,m,h,d,w suffixes; defaults to ms if numeric
    const match = ttl.match(/^(\d+)([smhdw])?$/);
    if (!match) {
      // Fallback: 7 days
      return add(new Date(), { days: 7 });
    }
    const amount = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w' | undefined;
    switch (unit) {
      case 's':
        return add(new Date(), { seconds: amount });
      case 'm':
        return add(new Date(), { minutes: amount });
      case 'h':
        return add(new Date(), { hours: amount });
      case 'd':
        return add(new Date(), { days: amount });
      case 'w':
        return add(new Date(), { weeks: amount });
      default:
        // if no unit, treat as seconds by default
        return add(new Date(), { seconds: amount });
    }
  }
}
