import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface JwtUserRequest {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller()
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: JwtUserRequest): { id: string; email: string | null } {
    return { id: req.user.userId, email: req.user.email ?? null } as const;
  }
}
