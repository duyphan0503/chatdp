import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.create({
      data: {
        id: params.id,
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
        userAgent: params.userAgent ?? undefined,
        ip: params.ip ?? undefined,
      },
    });
  }

  findById(id: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  async revoke(id: string, at: Date = new Date()): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: at } });
  }
}
