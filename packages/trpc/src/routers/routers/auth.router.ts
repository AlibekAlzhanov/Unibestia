import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import { Role, User, UserRole } from "@repo/db";
import { procedure, protectedProcedure, t } from "../base/index.js";

@Injectable()
export class AuthRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>
  ) {}

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  private async getRoleCodesByLocalUserId(userId: string): Promise<string[]> {
    const rows = await this.userRolesRepo
      .createQueryBuilder("userRole")
      .innerJoin(Role, "role", "role.id = userRole.roleId")
      .select("role.code", "code")
      .where("userRole.userId = :userId", { userId })
      .getRawMany<{ code: string }>();

    return rows.map((row) => row.code);
  }

  public readonly router = t.router({
    getSession: procedure.query(({ ctx }) => {
      return {
        isAuthenticated: ctx.auth.isAuthenticated,
        clerkUser: ctx.auth.user ?? null,
      };
    }),

    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authenticated Clerk user ID is missing",
        });
      }

      const user = await this.findLocalUserByClerkId(ctx.auth.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application user not found for current Clerk account",
        });
      }

      const roles = await this.getRoleCodesByLocalUserId(user.id);

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
        roles,
      };
    }),

    myRoles: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authenticated Clerk user ID is missing",
        });
      }

      const user = await this.findLocalUserByClerkId(ctx.auth.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application user not found for current Clerk account",
        });
      }

      const roles = await this.getRoleCodesByLocalUserId(user.id);

      return {
        userId: user.id,
        roles,
      };
    }),
  });
}
