import { Injectable } from '@nestjs/common';
import { UserRepository, UserRecord } from '../repositories/user.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async getById(id: string): Promise<UserRecord | null> {
    return this.users.findById(id);
  }
}
