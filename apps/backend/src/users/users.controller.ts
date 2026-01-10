import { Controller, Get, Param, Query, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

interface JwtUserRequest {
  user: {
    userId: string;
    email?: string;
  };
}

/**
 * HTTP endpoints for user-facing profile information.
 */
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Returns the id and email of the currently authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: JwtUserRequest): { id: string; email: string | null } {
    const { userId, email } = req.user;
    return { id: userId, email: email ?? null } as const;
  }

  /**
   * Returns a minimal public profile (id and email) for the given user id,
   * or 404 if the user does not exist.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  async getProfile(@Param('id') id: string): Promise<{ id: string; email: string | null }> {
    const user = await this.users.getCachedById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, email: user.email } as const;
  }

  /**
   * Search users by display name or email.
   */
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async searchUsers(
    @Query('q') q: string,
  ): Promise<
    Array<{ id: string; email: string | null; displayName: string; avatarUrl: string | null }>
  > {
    const users = await this.users.searchUsers(q);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    }));
  }
}
