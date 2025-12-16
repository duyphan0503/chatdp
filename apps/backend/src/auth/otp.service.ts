import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private redis: Redis | null = null;
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    } else {
      this.logger.warn('REDIS_URL not set, OTP service disabled');
    }
  }

  async generateOtp(email: string, type: 'verify' | 'forgot'): Promise<string> {
    if (!this.redis) throw new BadRequestException('OTP service unavailable');

    // Generate 6 digit OTP
    const otp = randomInt(100000, 999999).toString();
    const key = `otp:${type}:${email}`;
    // TTL: 5 minutes (300 seconds)
    await this.redis.set(key, otp, 'EX', 300);

    return otp;
  }

  async verifyOtp(email: string, otp: string, type: 'verify' | 'forgot'): Promise<boolean> {
    if (!this.redis) return false;

    const key = `otp:${type}:${email}`;
    const storedOtp = await this.redis.get(key);

    if (storedOtp === otp) {
      await this.redis.del(key); // Invalidate after use
      return true;
    }
    return false;
  }
}
