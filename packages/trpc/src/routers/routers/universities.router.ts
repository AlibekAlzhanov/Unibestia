import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { ILike, Repository } from "typeorm";
import {
  Role,
  University,
  UniversityEmailDomain,
  UniversityStatus,
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

const normalizeKeywordList = (
  value: string[] | null | undefined
): string[] | null => {
  if (!value) {
    return null;
  }

  const normalized = [...new Set(
    value
      .map((item) => item.trim())
      .filter(Boolean)
  )];

  return normalized.length > 0 ? normalized : null;
};

const universityStatusSchema = z.nativeEnum(UniversityStatus);

const universityPayloadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  shortName: z.string().trim().max(100).optional().nullable(),
  officialNameRu: z.string().trim().max(4000).optional().nullable(),
  officialNameKz: z.string().trim().max(4000).optional().nullable(),
  officialNameEn: z.string().trim().max(4000).optional().nullable(),
  documentKeywords: z.array(z.string().trim().min(1).max(255)).max(50).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().min(2).max(100).default("Kazakhstan"),
  status: universityStatusSchema.default(UniversityStatus.ACTIVE),
});

const universityUpdateSchema = universityPayloadSchema.partial().extend({
  id: z.string().uuid(),
});

@Injectable()
export class UniversitiesRouter {
  constructor(
    @InjectRepository(University)
    private readonly universitiesRepo: Repository<University>,
    @InjectRepository(UniversityEmailDomain)
    private readonly universityEmailDomainsRepo: Repository<UniversityEmailDomain>,
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

  private mapUniversity(university: University) {
    return {
      id: university.id,
      name: university.name,
      shortName: university.shortName,
      officialNameRu: university.officialNameRu,
      officialNameKz: university.officialNameKz,
      officialNameEn: university.officialNameEn,
      documentKeywords: university.documentKeywords ?? [],
      city: university.city,
      country: university.country,
      status: university.status,
      createdAt: university.createdAt,
      updatedAt: university.updatedAt,
      emailDomains: university.emailDomains?.map((domain) => ({
        id: domain.id,
        domain: domain.domain,
        isActive: domain.isActive,
        createdAt: domain.createdAt,
      })) ?? [],
    };
  }

  private async assertUniversityNameIsUnique(
    name: string,
    exceptId?: string
  ): Promise<void> {
    const existing = await this.universitiesRepo.findOne({
      where: { name },
    });

    if (existing && existing.id !== exceptId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "University with this name already exists",
      });
    }
  }

  public readonly router = t.router({
    listActive: procedure
      .input(
        z
          .object({
            search: z.string().trim().min(1).max(100).optional(),
            limit: z.number().int().min(1).max(100).default(100),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const where = input?.search
          ? [
              { status: UniversityStatus.ACTIVE, name: ILike(`%${input.search}%`) },
              { status: UniversityStatus.ACTIVE, shortName: ILike(`%${input.search}%`) },
              { status: UniversityStatus.ACTIVE, city: ILike(`%${input.search}%`) },
            ]
          : { status: UniversityStatus.ACTIVE };

        const [items, total] = await this.universitiesRepo.findAndCount({
          where,
          order: { name: "ASC" },
          take: input?.limit ?? 100,
          skip: input?.offset ?? 0,
        });

        return {
          total,
          limit: input?.limit ?? 100,
          offset: input?.offset ?? 0,
          items: items.map((university) => ({
            id: university.id,
            name: university.name,
            shortName: university.shortName,
            city: university.city,
            country: university.country,
          })),
        };
      }),

    adminList: protectedProcedure
      .input(
        z
          .object({
            search: z.string().trim().min(1).max(100).optional(),
            status: universityStatusSchema.optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const baseWhere = input?.status ? { status: input.status } : {};
        const where = input?.search
          ? [
              { ...baseWhere, name: ILike(`%${input.search}%`) },
              { ...baseWhere, shortName: ILike(`%${input.search}%`) },
              { ...baseWhere, city: ILike(`%${input.search}%`) },
              { ...baseWhere, officialNameRu: ILike(`%${input.search}%`) },
              { ...baseWhere, officialNameKz: ILike(`%${input.search}%`) },
            ]
          : baseWhere;

        const [items, total] = await this.universitiesRepo.findAndCount({
          where,
          relations: { emailDomains: true },
          order: { name: "ASC" },
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
        });

        return {
          total,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
          items: items.map((university) => this.mapUniversity(university)),
        };
      }),

    adminGetById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const university = await this.universitiesRepo.findOne({
          where: { id: input.id },
          relations: { emailDomains: true },
        });

        if (!university) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "University not found",
          });
        }

        return this.mapUniversity(university);
      }),

    adminCreate: protectedProcedure
      .input(universityPayloadSchema)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);
        await this.assertUniversityNameIsUnique(input.name);

        const university = this.universitiesRepo.create({
          name: input.name.trim(),
          shortName: normalizeNullableText(input.shortName),
          officialNameRu: normalizeNullableText(input.officialNameRu),
          officialNameKz: normalizeNullableText(input.officialNameKz),
          officialNameEn: normalizeNullableText(input.officialNameEn),
          documentKeywords: normalizeKeywordList(input.documentKeywords),
          city: normalizeNullableText(input.city),
          country: input.country.trim(),
          status: input.status,
        });

        const saved = await this.universitiesRepo.save(university);
        return this.mapUniversity({ ...saved, emailDomains: [] });
      }),

    adminUpdate: protectedProcedure
      .input(universityUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const university = await this.universitiesRepo.findOne({
          where: { id: input.id },
          relations: { emailDomains: true },
        });

        if (!university) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "University not found",
          });
        }

        if (input.name && input.name !== university.name) {
          await this.assertUniversityNameIsUnique(input.name, university.id);
          university.name = input.name.trim();
        }

        if ("shortName" in input) {
          university.shortName = normalizeNullableText(input.shortName);
        }
        if ("officialNameRu" in input) {
          university.officialNameRu = normalizeNullableText(input.officialNameRu);
        }
        if ("officialNameKz" in input) {
          university.officialNameKz = normalizeNullableText(input.officialNameKz);
        }
        if ("officialNameEn" in input) {
          university.officialNameEn = normalizeNullableText(input.officialNameEn);
        }
        if ("documentKeywords" in input) {
          university.documentKeywords = normalizeKeywordList(input.documentKeywords);
        }
        if ("city" in input) {
          university.city = normalizeNullableText(input.city);
        }
        if (input.country) {
          university.country = input.country.trim();
        }
        if (input.status) {
          university.status = input.status;
        }

        const saved = await this.universitiesRepo.save(university);
        const reloaded = await this.universitiesRepo.findOneOrFail({
          where: { id: saved.id },
          relations: { emailDomains: true },
        });

        return this.mapUniversity(reloaded);
      }),

    adminDeactivate: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const university = await this.universitiesRepo.findOne({
          where: { id: input.id },
          relations: { emailDomains: true },
        });

        if (!university) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "University not found",
          });
        }

        university.status = UniversityStatus.INACTIVE;
        const saved = await this.universitiesRepo.save(university);
        return this.mapUniversity(saved);
      }),

    adminAddEmailDomain: protectedProcedure
      .input(
        z.object({
          universityId: z.string().uuid(),
          domain: z.string().trim().min(3).max(255),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const university = await this.universitiesRepo.findOne({
          where: { id: input.universityId },
        });

        if (!university) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "University not found",
          });
        }

        const domain = input.domain.trim().toLowerCase().replace(/^@/, "");
        const existing = await this.universityEmailDomainsRepo.findOne({
          where: { domain },
        });

        if (existing && existing.universityId !== input.universityId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email domain is already assigned to another university",
          });
        }

        if (existing) {
          existing.isActive = true;
          return this.universityEmailDomainsRepo.save(existing);
        }

        const created = this.universityEmailDomainsRepo.create({
          universityId: input.universityId,
          domain,
          isActive: true,
        });

        return this.universityEmailDomainsRepo.save(created);
      }),

    adminSetEmailDomainActive: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const domain = await this.universityEmailDomainsRepo.findOne({
          where: { id: input.id },
        });

        if (!domain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "University email domain not found",
          });
        }

        domain.isActive = input.isActive;
        return this.universityEmailDomainsRepo.save(domain);
      }),
  });
}
