import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/auth/auth.service.js';
import { UserRepository, UserRecord } from '../../src/repositories/user.repository.js';
import { RefreshTokenRepository, RefreshTokenRecord } from '../../src/repositories/refresh-token.repository.js';

class InMemoryRefreshTokenRepo implements Partial<RefreshTokenRepository> {
  store = new Map<string, RefreshTokenRecord>();

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<RefreshTokenRecord> {
    const rec: RefreshTokenRecord = {
      id: params.id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      revokedAt: null,
      userAgent: params.userAgent ?? null,
      ip: params.ip ?? null,
      createdAt: new Date(),
    };
    this.store.set(rec.id, rec);
    return rec;
  }

  async findById(id: string): Promise<RefreshTokenRecord | null> {
    return this.store.get(id) ?? null;
  }

  async revoke(id: string, at: Date = new Date()): Promise<RefreshTokenRecord> {
    const rec = this.store.get(id);
    if (!rec) throw new Error('not found');
    rec.revokedAt = at;
    this.store.set(id, rec);
    return rec;
  }
}

describe('AuthService (unit) - refresh rotation, logout, and UA/IP binding', () => {
  const user: UserRecord = {
    id: 'u1',
    email: 'a@b.com',
    phoneNumber: null,
    passwordHash: '',
    displayName: 'Alice',
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let auth: AuthService;
  let usersMock: Partial<UserRepository>;
  let rtRepo: InMemoryRefreshTokenRepo;
  let jwt: JwtService;

  beforeEach(async () => {
    rtRepo = new InMemoryRefreshTokenRepo();
    usersMock = {
      findByEmail: async (email: string) => (email === user.email ? user : null),
      findById: async (id: string) => (id === user.id ? user : null),
      create: async (data) => ({ ...user, id: 'u2', email: data.email ?? null, passwordHash: data.passwordHash }),
    } as Partial<UserRepository>;

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'testsecret', signOptions: { expiresIn: '15m' } })],
       providers: [
        AuthService,
        { provide: UserRepository, useValue: usersMock },
        { provide: RefreshTokenRepository, useValue: rtRepo },
        { provide: ConfigService, useValue: { get: (k: string) => {
          if (k === 'JWT_SECRET') return 'testsecret';
          if (k === 'JWT_EXPIRES_IN') return '15m';
          if (k === 'REFRESH_TOKEN_TTL') return '2m';
          if (k === 'REFRESH_BIND_UA_IP') return 'true';
          return undefined;
        } } },
      ],
    }).compile();

    auth = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('issues tokens on login and rotates on refresh', async () => {
    // prepare password
    const pw = 'secretpw';
    user.passwordHash = await argon2.hash(pw);

    const first = await auth.login({ email: user.email!, password: pw });
    expect(first.accessToken).toBeTruthy();
    expect(first.refreshToken).toBeTruthy();

    // stored record exists and matches refresh token hash
    const payload1 = jwt.decode(first.refreshToken) as any;
    const rec1 = await rtRepo.findById(payload1.jti);
    expect(rec1).not.toBeNull();
    expect(rec1!.revokedAt).toBeNull();

    const second = await auth.refresh(first.refreshToken);
    expect(second.refreshToken).toBeTruthy();
    expect(second.refreshToken).not.toEqual(first.refreshToken);

    // old should be revoked
    const rec1After = await rtRepo.findById(payload1.jti);
    expect(rec1After!.revokedAt).not.toBeNull();

    // new stored
    const payload2 = jwt.decode(second.refreshToken) as any;
    const rec2 = await rtRepo.findById(payload2.jti);
    expect(rec2).not.toBeNull();
    expect(rec2!.revokedAt).toBeNull();
  });

  it('logout revokes without throwing for invalid token', async () => {
    await expect(auth.logout('not-a-jwt')).resolves.toBeUndefined();
  });

  it('refresh with invalid token throws Unauthorized', async () => {
    await expect(auth.refresh('not-a-jwt')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout is idempotent (second call no-op)', async () => {
    const pw = 'secretpw2';
    user.passwordHash = await argon2.hash(pw);
    const tokens = await auth.login({ email: user.email!, password: pw });

    const payload = jwt.decode(tokens.refreshToken) as any;
    const before = await rtRepo.findById(payload.jti);
    expect(before).not.toBeNull();
    expect(before!.revokedAt).toBeNull();

    await expect(auth.logout(tokens.refreshToken)).resolves.toBeUndefined();

    const afterFirst = await rtRepo.findById(payload.jti);
    expect(afterFirst!.revokedAt).not.toBeNull();

    // Call logout again should not throw and remain revoked
    await expect(auth.logout(tokens.refreshToken)).resolves.toBeUndefined();
    const afterSecond = await rtRepo.findById(payload.jti);
    expect(afterSecond!.revokedAt).not.toBeNull();
  });

  it('refresh after logout should fail', async () => {
    const pw = 'secretpw3';
    user.passwordHash = await argon2.hash(pw);
    const tokens = await auth.login({ email: user.email!, password: pw });

    await auth.logout(tokens.refreshToken);

    await expect(auth.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('enforces UA/IP binding when enabled', async () => {
    const pw = 'secretpw4';
    user.passwordHash = await argon2.hash(pw);
    // Login with UA/IP A
    const first = await auth.login({ email: user.email!, password: pw }, { userAgent: 'UA-A', ip: '1.1.1.1' });
    const payload = jwt.decode(first.refreshToken) as any;
    const stored = await rtRepo.findById(payload.jti);
    expect(stored?.userAgent).toBe('UA-A');
    expect(stored?.ip).toBe('1.1.1.1');

    // Try refresh with different UA/IP should fail
    await expect(
      auth.refresh(first.refreshToken, { userAgent: 'UA-B', ip: '2.2.2.2' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // Refresh with matching UA/IP should succeed
    const second = await auth.refresh(first.refreshToken, { userAgent: 'UA-A', ip: '1.1.1.1' });
    expect(second.refreshToken).toBeTruthy();
  });
});
