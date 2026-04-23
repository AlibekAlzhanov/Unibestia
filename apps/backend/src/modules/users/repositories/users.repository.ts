import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role, User, UserRole, UserStatus } from "@repo/db";
import { UserWithRoles } from "../types/user-with-roles.type.js";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByClerkUserId(clerkUserId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { clerkUserId } });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    await this.usersRepo.update({ id }, { status });
    return this.findById(id);
  }

  async getRoleCodesByUserId(userId: string): Promise<string[]> {
    const rows = await this.userRolesRepo
      .createQueryBuilder("userRole")
      .innerJoin(Role, "role", "role.id = userRole.roleId")
      .select("role.code", "code")
      .where("userRole.userId = :userId", { userId })
      .getRawMany<{ code: string }>();

    return rows.map((row) => row.code);
  }

  async getUserWithRolesById(userId: string): Promise<UserWithRoles | null> {
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    const roles = await this.getRoleCodesByUserId(user.id);

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roles,
    };
  }
}
