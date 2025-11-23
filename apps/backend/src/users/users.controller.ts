import { Controller, Get, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

interface JwtUserRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: JwtUserRequest): { id: string; email: string | null } {
    const { userId, email } = req.user;
    return { id: userId, email: email ?? null } as const;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/profile/:id')
  async getProfile(@Param('id') id: string): Promise<{ id: string; email: string | null }> {
    const user = await this.users.getCachedById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, email: user.email } as const;
  }
}
