import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { ILike, Repository } from "typeorm";
import {
  EducationDegree,
  EducationProgramGroup,
  User,
  UserRole,
} from "@repo/db";
import { procedure, protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

type AuthContextLike = {
  auth: {
    userId: string | null;
    user?: {
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
  };
};

const normalizeNullableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const educationDegreeSchema = z.nativeEnum(EducationDegree);

const educationProgramPayloadSchema = z.object({
  code: z.string().trim().min(1).max(20),
  nameRu: z.string().trim().min(2).max(255),
  nameKz: z.string().trim().min(2).max(255),
  nameEn: z.string().trim().max(255).optional().nullable(),
  degree: educationDegreeSchema.default(EducationDegree.BACHELOR),
  isActive: z.boolean().default(true),
});

const educationProgramUpdateSchema = educationProgramPayloadSchema
  .partial()
  .extend({ id: z.string().uuid() });

const educationProgramsListSchema = z
  .object({
    degree: educationDegreeSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(200).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

@Injectable()
export class EducationProgramsRouter {
  constructor(
    @InjectRepository(EducationProgramGroup)
    private readonly educationProgramGroupsRepo: Repository<EducationProgramGroup>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>
  ) {}

  private async getOrCreateCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const existing = await this.usersRepo.findOne({
      where: { clerkUserId: ctx.auth.userId },
    });

    if (existing) {
      return existing;
    }

    const email =
      ctx.auth.user?.email?.trim().toLowerCase() ??
      `${ctx.auth.userId}@clerk.local`;

    const userWithEmail = await this.usersRepo.findOne({ where: { email } });

    if (userWithEmail) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "A local user with this email already exists. Link the Clerk account to this user first.",
      });
    }

    const displayName = [ctx.auth.user?.firstName, ctx.auth.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = this.usersRepo.create({
      clerkUserId: ctx.auth.userId,
      email,
      firstName: ctx.auth.user?.firstName ?? null,
      lastName: ctx.auth.user?.lastName ?? null,
      displayName: displayName || email,
      avatarUrl: ctx.auth.user?.imageUrl ?? null,
      phone: null,
      status: "active" as User["status"],
      lastLoginAt: new Date(),
    });

    return this.usersRepo.save(user);
  }

  private async getRoleCodes(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepo.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles
      .map((userRole) => userRole.role?.code)
      .filter((code): code is string => Boolean(code));
  }

  private async requireAdminUser(ctx: AuthContextLike): Promise<User> {
    const user = await this.getOrCreateCurrentUser(ctx);
    const roles = await this.getRoleCodes(user.id);

    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access is required",
      });
    }

    return user;
  }

  private mapProgram(program: EducationProgramGroup) {
    return {
      id: program.id,
      code: program.code,
      nameRu: program.nameRu,
      nameKz: program.nameKz,
      nameEn: program.nameEn,
      degree: program.degree,
      isActive: program.isActive,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  private async assertProgramCodeIsUnique(input: {
    code: string;
    degree: EducationDegree;
    exceptId?: string;
  }): Promise<void> {
    const existing = await this.educationProgramGroupsRepo.findOne({
      where: {
        code: input.code.trim().toUpperCase(),
        degree: input.degree,
      },
    });

    if (existing && existing.id !== input.exceptId) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Education program group with this code already exists for selected degree",
      });
    }
  }

  private async listActivePrograms(input: {
    degree?: EducationDegree;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const baseWhere = {
      isActive: true,
      ...(input.degree ? { degree: input.degree } : {}),
    };

    const where = input.search
      ? [
          { ...baseWhere, code: ILike(`%${input.search}%`) },
          { ...baseWhere, nameRu: ILike(`%${input.search}%`) },
          { ...baseWhere, nameKz: ILike(`%${input.search}%`) },
          { ...baseWhere, nameEn: ILike(`%${input.search}%`) },
        ]
      : baseWhere;

    const [items, total] = await this.educationProgramGroupsRepo.findAndCount({
      where,
      order: { code: "ASC", nameRu: "ASC" },
      take: input.limit ?? 100,
      skip: input.offset ?? 0,
    });

    return {
      total,
      limit: input.limit ?? 100,
      offset: input.offset ?? 0,
      items: items.map((program) => ({
        id: program.id,
        code: program.code,
        nameRu: program.nameRu,
        nameKz: program.nameKz,
        nameEn: program.nameEn,
        degree: program.degree,
      })),
    };
  }

  public readonly router = t.router({
    listActive: procedure.input(educationProgramsListSchema).query(({ input }) => {
      return this.listActivePrograms(input ?? {});
    }),

    // Kept for backward compatibility with early student profile UI drafts.
    // Education program groups are now global, so universityId is ignored.
    listByUniversity: procedure
      .input(
        z.object({
          universityId: z.string().uuid().optional(),
          degree: educationDegreeSchema.optional(),
          search: z.string().trim().min(1).max(100).optional(),
          limit: z.number().int().min(1).max(200).default(100),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(({ input }) => {
        return this.listActivePrograms(input);
      }),

    adminList: protectedProcedure
      .input(
        z
          .object({
            degree: educationDegreeSchema.optional(),
            isActive: z.boolean().optional(),
            search: z.string().trim().min(1).max(100).optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const baseWhere = {
          ...(input?.degree ? { degree: input.degree } : {}),
          ...(typeof input?.isActive === "boolean" ? { isActive: input.isActive } : {}),
        };

        const where = input?.search
          ? [
              { ...baseWhere, code: ILike(`%${input.search}%`) },
              { ...baseWhere, nameRu: ILike(`%${input.search}%`) },
              { ...baseWhere, nameKz: ILike(`%${input.search}%`) },
              { ...baseWhere, nameEn: ILike(`%${input.search}%`) },
            ]
          : baseWhere;

        const [items, total] = await this.educationProgramGroupsRepo.findAndCount({
          where,
          order: { code: "ASC", nameRu: "ASC" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        });

        return {
          total,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
          items: items.map((program) => this.mapProgram(program)),
        };
      }),

    adminGetById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const program = await this.educationProgramGroupsRepo.findOne({
          where: { id: input.id },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Education program group not found",
          });
        }

        return this.mapProgram(program);
      }),

    adminCreate: protectedProcedure
      .input(educationProgramPayloadSchema)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);
        await this.assertProgramCodeIsUnique({
          code: input.code,
          degree: input.degree,
        });

        const program = this.educationProgramGroupsRepo.create({
          code: input.code.trim().toUpperCase(),
          nameRu: input.nameRu.trim(),
          nameKz: input.nameKz.trim(),
          nameEn: normalizeNullableText(input.nameEn),
          degree: input.degree,
          isActive: input.isActive,
        });

        const saved = await this.educationProgramGroupsRepo.save(program);
        return this.mapProgram(saved);
      }),

    adminUpdate: protectedProcedure
      .input(educationProgramUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const program = await this.educationProgramGroupsRepo.findOne({
          where: { id: input.id },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Education program group not found",
          });
        }

        const nextCode = input.code?.trim().toUpperCase() ?? program.code;
        const nextDegree = input.degree ?? program.degree;

        if (nextCode !== program.code || nextDegree !== program.degree) {
          await this.assertProgramCodeIsUnique({
            code: nextCode,
            degree: nextDegree,
            exceptId: program.id,
          });
        }

        program.code = nextCode;
        program.degree = nextDegree;

        if (input.nameRu) {
          program.nameRu = input.nameRu.trim();
        }
        if (input.nameKz) {
          program.nameKz = input.nameKz.trim();
        }
        if ("nameEn" in input) {
          program.nameEn = normalizeNullableText(input.nameEn);
        }
        if (typeof input.isActive === "boolean") {
          program.isActive = input.isActive;
        }

        const saved = await this.educationProgramGroupsRepo.save(program);
        return this.mapProgram(saved);
      }),

    adminDeactivate: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const program = await this.educationProgramGroupsRepo.findOne({
          where: { id: input.id },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Education program group not found",
          });
        }

        program.isActive = false;
        const saved = await this.educationProgramGroupsRepo.save(program);
        return this.mapProgram(saved);
      }),
  });
}
