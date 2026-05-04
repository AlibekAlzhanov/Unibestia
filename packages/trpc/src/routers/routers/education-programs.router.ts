import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { ILike, Repository } from "typeorm";
import {
  EducationDegree,
  EducationProgramGroup,
  Role,
  University,
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
  universityId: z.string().uuid(),
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

@Injectable()
export class EducationProgramsRouter {
  constructor(
    @InjectRepository(EducationProgramGroup)
    private readonly educationProgramGroupsRepo: Repository<EducationProgramGroup>,
    @InjectRepository(University)
    private readonly universitiesRepo: Repository<University>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>
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
      universityId: program.universityId,
      code: program.code,
      nameRu: program.nameRu,
      nameKz: program.nameKz,
      nameEn: program.nameEn,
      degree: program.degree,
      isActive: program.isActive,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      university: program.university
        ? {
            id: program.university.id,
            name: program.university.name,
            shortName: program.university.shortName,
            city: program.university.city,
            status: program.university.status,
          }
        : null,
    };
  }

  private async assertUniversityExists(universityId: string): Promise<University> {
    const university = await this.universitiesRepo.findOne({
      where: { id: universityId },
    });

    if (!university) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "University not found",
      });
    }

    return university;
  }

  private async assertProgramCodeIsUnique(input: {
    universityId: string;
    code: string;
    exceptId?: string;
  }): Promise<void> {
    const existing = await this.educationProgramGroupsRepo.findOne({
      where: {
        universityId: input.universityId,
        code: input.code.trim().toUpperCase(),
      },
    });

    if (existing && existing.id !== input.exceptId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Education program group with this code already exists for selected university",
      });
    }
  }

  public readonly router = t.router({
    listByUniversity: procedure
      .input(
        z.object({
          universityId: z.string().uuid(),
          degree: educationDegreeSchema.optional(),
          search: z.string().trim().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        const baseWhere = {
          universityId: input.universityId,
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

        const items = await this.educationProgramGroupsRepo.find({
          where,
          order: { code: "ASC", nameRu: "ASC" },
        });

        return items.map((program) => ({
          id: program.id,
          universityId: program.universityId,
          code: program.code,
          nameRu: program.nameRu,
          nameKz: program.nameKz,
          nameEn: program.nameEn,
          degree: program.degree,
        }));
      }),

    adminList: protectedProcedure
      .input(
        z
          .object({
            universityId: z.string().uuid().optional(),
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
          ...(input?.universityId ? { universityId: input.universityId } : {}),
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
          relations: { university: true },
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
          relations: { university: true },
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
        await this.assertUniversityExists(input.universityId);
        await this.assertProgramCodeIsUnique({
          universityId: input.universityId,
          code: input.code,
        });

        const program = this.educationProgramGroupsRepo.create({
          universityId: input.universityId,
          code: input.code.trim().toUpperCase(),
          nameRu: input.nameRu.trim(),
          nameKz: input.nameKz.trim(),
          nameEn: normalizeNullableText(input.nameEn),
          degree: input.degree,
          isActive: input.isActive,
        });

        const saved = await this.educationProgramGroupsRepo.save(program);
        const reloaded = await this.educationProgramGroupsRepo.findOneOrFail({
          where: { id: saved.id },
          relations: { university: true },
        });

        return this.mapProgram(reloaded);
      }),

    adminUpdate: protectedProcedure
      .input(educationProgramUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const program = await this.educationProgramGroupsRepo.findOne({
          where: { id: input.id },
          relations: { university: true },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Education program group not found",
          });
        }

        const nextUniversityId = input.universityId ?? program.universityId;
        const nextCode = input.code?.trim().toUpperCase() ?? program.code;

        if (input.universityId) {
          await this.assertUniversityExists(input.universityId);
        }

        if (nextUniversityId !== program.universityId || nextCode !== program.code) {
          await this.assertProgramCodeIsUnique({
            universityId: nextUniversityId,
            code: nextCode,
            exceptId: program.id,
          });
        }

        program.universityId = nextUniversityId;
        program.code = nextCode;

        if (input.nameRu) {
          program.nameRu = input.nameRu.trim();
        }
        if (input.nameKz) {
          program.nameKz = input.nameKz.trim();
        }
        if ("nameEn" in input) {
          program.nameEn = normalizeNullableText(input.nameEn);
        }
        if (input.degree) {
          program.degree = input.degree;
        }
        if (typeof input.isActive === "boolean") {
          program.isActive = input.isActive;
        }

        const saved = await this.educationProgramGroupsRepo.save(program);
        const reloaded = await this.educationProgramGroupsRepo.findOneOrFail({
          where: { id: saved.id },
          relations: { university: true },
        });

        return this.mapProgram(reloaded);
      }),

    adminDeactivate: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const program = await this.educationProgramGroupsRepo.findOne({
          where: { id: input.id },
          relations: { university: true },
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
