import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

import { OtpService } from '../../src/auth/otp.service.js';
import { MailService } from '../../src/common/mail/mail.service.js';
import { VerifyEmailDto } from '../../src/auth/dto/verify-email.dto.js';
import { ResetPasswordDto } from '../../src/auth/dto/reset-password.dto.js';

import { AuthService } from '../../src/auth/auth.service.js';
import { UserRepository, UserRecord } from '../../src/repositories/user.repository.js';
import {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from '../../src/repositories/refresh-token.repository.js';

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
    emailVerified: null,
  };

  let auth: AuthService;
  let usersMock: Partial<UserRepository>;
  let rtRepo: InMemoryRefreshTokenRepo;
  let jwt: JwtService;
  let otpService: Partial<OtpService>;
  let mailService: Partial<MailService>;

  beforeEach(async () => {
    // Clear global mocks
    mockVerifyIdToken.mockReset();
    (argon2.hash as jest.Mock).mockReset();
    (argon2.verify as jest.Mock).mockReset();

    // Default mock behaviors
    (argon2.hash as jest.Mock).mockResolvedValue('hashed_pw');
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    rtRepo = new InMemoryRefreshTokenRepo();
    usersMock = {
      findByEmail: jest.fn(async (email: string) => (email === user.email ? { ...user } : null)),
      findById: jest.fn(async (id: string) => (id === user.id ? { ...user } : null)),
      create: jest.fn(async (data) => ({
        ...user,
        id: 'u2',
        email: data.email ?? null,
        passwordHash: data.passwordHash,
      })),
      verifyEmail: jest.fn(),
      updatePassword: jest.fn(),
    } as Partial<UserRepository>;

    otpService = {
      generateOtp: jest.fn().mockResolvedValue('123456'),
      verifyOtp: jest.fn().mockResolvedValue(true),
    };

    mailService = {
      sendOtp: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'testsecret', signOptions: { expiresIn: '15m' } })],
      providers: [
        AuthService,
        { provide: UserRepository, useValue: usersMock },
        { provide: RefreshTokenRepository, useValue: rtRepo },
        { provide: OtpService, useValue: otpService },
        { provide: MailService, useValue: mailService },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) => {
              if (k === 'JWT_SECRET') return 'testsecret';
              if (k === 'JWT_EXPIRES_IN') return '15m';
              if (k === 'REFRESH_TOKEN_TTL') return '2m';
              if (k === 'REFRESH_BIND_UA_IP') return 'true';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    auth = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  describe('Tokens & Session', () => {
    it('issues tokens on login and rotates on refresh', async () => {
      // prepare password
      const pw = 'secretpw';
      (argon2.hash as jest.Mock).mockResolvedValue(await argon2.hash(pw)); // Wait, circular mock if not handled careful. Just use string.
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_pw');
      user.passwordHash = 'hashed_pw';
      (argon2.verify as jest.Mock).mockResolvedValue(true);

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
      user.passwordHash = 'hashed_pw2';
      const tokens = await auth.login({ email: user.email!, password: pw });

      const payload = jwt.decode(tokens.refreshToken) as any;
      const before = await rtRepo.findById(payload.jti);
      expect(before).not.toBeNull();
      expect(before!.revokedAt).toBeNull();

      await expect(auth.logout(tokens.refreshToken)).resolves.toBeUndefined();

      const afterFirst = await rtRepo.findById(payload.jti);
      expect(afterFirst!.revokedAt).not.toBeNull();

      await expect(auth.logout(tokens.refreshToken)).resolves.toBeUndefined();
      const afterSecond = await rtRepo.findById(payload.jti);
      expect(afterSecond!.revokedAt).not.toBeNull();
    });

    it('refresh after logout should fail', async () => {
      const pw = 'secretpw3';
      user.passwordHash = 'hashed_pw3';
      const tokens = await auth.login({ email: user.email!, password: pw });

      await auth.logout(tokens.refreshToken);

      await expect(auth.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('enforces UA/IP binding when enabled', async () => {
      const pw = 'secretpw4';
      user.passwordHash = 'hashed_pw4';
      // Login with UA/IP A
      const first = await auth.login(
        { email: user.email!, password: pw },
        { userAgent: 'UA-A', ip: '1.1.1.1' },
      );
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

  describe('Email Verification & Password Reset', () => {
    it('sendVerificationEmail: sends OTP if not verified', async () => {
      // Setup: user exists, not verified
      user.emailVerified = null;
      await auth.sendVerificationEmail('u1');

      expect(usersMock.findById).toHaveBeenCalledWith('u1');
      expect(otpService.generateOtp).toHaveBeenCalledWith(user.email, 'verify');
      expect(mailService.sendOtp).toHaveBeenCalledWith(user.email, '123456', 'Verify your email');
    });

    it('sendVerificationEmail: does nothing if already verified', async () => {
      user.emailVerified = new Date();
      await auth.sendVerificationEmail('u1');
      expect(otpService.generateOtp).not.toHaveBeenCalled();
    });

    it('verifyEmail: success updates user', async () => {
      user.emailVerified = null;
      const dto: VerifyEmailDto = { email: 'a@b.com', otp: '123456' };

      const result = await auth.verifyEmail(dto);
      expect(result.success).toBe(true);
      expect(otpService.verifyOtp).toHaveBeenCalledWith(dto.email, dto.otp, 'verify');
      expect(usersMock.verifyEmail).toHaveBeenCalledWith(dto.email);
    });

    it('verifyEmail: throws if OTP invalid', async () => {
      (otpService.verifyOtp as jest.Mock).mockResolvedValueOnce(false);
      const dto: VerifyEmailDto = { email: 'a@b.com', otp: 'wrong' };

      await expect(auth.verifyEmail(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('resetPassword: success updates password', async () => {
      const dto: ResetPasswordDto = { email: 'a@b.com', otp: '123456', newPassword: 'new' };
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_new');

      const result = await auth.resetPassword(dto);
      expect(result.success).toBe(true);
      expect(otpService.verifyOtp).toHaveBeenCalledWith(dto.email, dto.otp, 'forgot');
      expect(usersMock.updatePassword).toHaveBeenCalledWith(dto.email, 'hashed_new');
    });
  });

  describe('Google Login', () => {
    it('googleLogin: verifies token and creates user if new', async () => {
      // Mock Google response
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google@test.com',
          sub: 'google_123',
          picture: 'pic.jpg',
          name: 'Google User',
        }),
      });

      const result = await auth.googleLogin('valid_google_token', {
        userAgent: 'UA',
        ip: '1.2.3.4',
      });

      // Verify
      expect(result.accessToken).toBeTruthy();
      expect(usersMock.findByEmail).toHaveBeenCalledWith('google@test.com');
      expect(usersMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'google@test.com',
          displayName: 'Google User',
          avatarUrl: 'pic.jpg',
          emailVerified: expect.any(Date),
        }),
      );
    });

    it('googleLogin: throws Unauthorized if token invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
      await expect(auth.googleLogin('bad_token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
