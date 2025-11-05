import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateUserInput {
  email?: string | null;
  phoneNumber?: string | null;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
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
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
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
      },
    });
  }

  async updateDisplayName(id: string, displayName: string): Promise<UserRecord> {
    return this.prisma.user.update({ where: { id }, data: { displayName } });
  }
}
