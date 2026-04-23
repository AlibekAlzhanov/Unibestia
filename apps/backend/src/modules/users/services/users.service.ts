import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@repo/db";
import { UsersRepository } from "../repositories/users.repository.js";
import { UserWithRoles } from "../types/user-with-roles.type.js";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.usersRepository.findByClerkUserId(clerkUserId);
  }

  async getUserWithRoles(userId: string): Promise<UserWithRoles> {
    const user = await this.usersRepository.getUserWithRolesById(userId);

    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    return user;
  }

  async updateStatus(userId: string, status: UserStatus) {
    const updated = await this.usersRepository.updateStatus(userId, status);

    if (!updated) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    return updated;
  }

  async getRoleCodes(userId: string): Promise<string[]> {
    return this.usersRepository.getRoleCodesByUserId(userId);
  }
}
