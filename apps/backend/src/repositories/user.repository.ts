import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateUserInput {
  email?: string | null;
  phoneNumber?: string | null;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified?: Date | null;
}

// Repository-level representation of a user (decoupled from Prisma types)
export interface UserRecord {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<UserRecord | null>;
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } }) as Promise<UserRecord | null>;
  }

  async create(data: CreateUserInput): Promise<UserRecord> {
    return this.prisma.user.create({
      data: {
        email: data.email ?? undefined,
        phoneNumber: data.phoneNumber ?? undefined,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl ?? undefined,
        bio: data.bio ?? undefined,
        emailVerified: data.emailVerified ?? undefined,
      },
    }) as Promise<UserRecord>;
  }

  async updateDisplayName(id: string, displayName: string): Promise<UserRecord> {
    return this.prisma.user.update({ where: { id }, data: { displayName } }) as Promise<UserRecord>;
  }

  async verifyEmail(email: string): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }) as Promise<UserRecord>;
  }

  async updatePassword(email: string, passwordHash: string): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    }) as Promise<UserRecord>;
  }

  async searchUsers(query: string, limit: number = 20): Promise<UserRecord[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    }) as Promise<UserRecord[]>;
  }
}
