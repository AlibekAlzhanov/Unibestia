import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import {
  Role,
  StudentProfile,
  StudentVerification,
  StudentVerificationRequestStatus,
  StudentVerificationStatus,
  University,
  User,
  UserRole,
  UserStatus,
} from "@repo/db";
import { protectedProcedure, t } from "../base/index.js";
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

@Injectable()
export class AdminStudentVerificationsRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(StudentVerification)
    private readonly studentVerificationsRepo: Repository<StudentVerification>,
    @InjectRepository(University)
    private readonly universitiesRepo: Repository<University>
  ) {}

  private async getOrCreateCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Не найден идентификатор авторизованного пользователя",
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

    const userWithEmail = await this.usersRepo.findOne({
      where: { email },
    });

    if (userWithEmail) {
      userWithEmail.clerkUserId = ctx.auth.userId;
      userWithEmail.lastLoginAt = new Date();

      return this.usersRepo.save(userWithEmail);
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
      status: UserStatus.ACTIVE,
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
        message: "Требуется доступ администратора",
      });
    }

    return user;
  }

  private mapVerification(item: StudentVerification) {
    const studentProfile = item.studentProfile ?? null;
    const user = item.user ?? null;
    const university = studentProfile?.university ?? null;
    const educationProgramGroup = studentProfile?.educationProgramGroup ?? null;
    const reviewedBy = item.reviewedBy ?? null;

    return {
      id: item.id,
      method: item.method,
      status: item.status,
      submittedEmail: item.submittedEmail,
      documentType: item.documentType,
      documentUrl: item.documentUrl
        ? `/student-verifications/documents/${item.id}`
        : null,
      reviewComment: item.reviewComment,
      reviewedAt: item.reviewedAt,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      student: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            status: user.status,
          }
        : null,
      studentProfile: studentProfile
        ? {
            id: studentProfile.id,
            verificationStatus: studentProfile.verificationStatus,
            studentEmail: studentProfile.studentEmail,
            degree: studentProfile.degree,
            educationProgramGroupId: studentProfile.educationProgramGroupId,
            specialty: studentProfile.specialty,
            educationProgramGroup: educationProgramGroup
              ? {
                  id: educationProgramGroup.id,
                  code: educationProgramGroup.code,
                  nameRu: educationProgramGroup.nameRu,
                  nameKz: educationProgramGroup.nameKz,
                  nameEn: educationProgramGroup.nameEn,
                  degree: educationProgramGroup.degree,
                  isActive: educationProgramGroup.isActive,
                }
              : null,
            course: studentProfile.course,
            admissionDate: studentProfile.admissionDate,
            verifiedAt: studentProfile.verifiedAt,
            verificationExpiresAt: studentProfile.verificationExpiresAt,
            university: university
              ? {
                  id: university.id,
                  name: university.name,
                  shortName: university.shortName,
                  city: university.city,
                  country: university.country,
                  status: university.status,
                }
              : null,
          }
        : null,
      reviewedBy: reviewedBy
        ? {
            id: reviewedBy.id,
            email: reviewedBy.email,
            displayName: reviewedBy.displayName,
          }
        : null,
    };
  }

  private createVerificationListQuery(input?: {
    status?: StudentVerificationRequestStatus;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Math.max(input?.limit ?? 30, 1), 100);
    const offset = Math.max(input?.offset ?? 0, 0);

    const query = this.studentVerificationsRepo
      .createQueryBuilder("verification")
      .leftJoin("verification.user", "user")
      .leftJoin("verification.studentProfile", "studentProfile")
      .leftJoin("studentProfile.university", "university")
      .leftJoin("studentProfile.educationProgramGroup", "educationProgramGroup")
      .leftJoin("verification.reviewedBy", "reviewedBy")
      .select([
        "verification.id",
        "verification.method",
        "verification.status",
        "verification.submittedEmail",
        "verification.documentUrl",
        "verification.documentType",
        "verification.reviewComment",
        "verification.reviewedAt",
        "verification.expiresAt",
        "verification.createdAt",
        "verification.updatedAt",

        "user.id",
        "user.email",
        "user.firstName",
        "user.lastName",
        "user.displayName",
        "user.status",

        "studentProfile.id",
        "studentProfile.verificationStatus",
        "studentProfile.studentEmail",
        "studentProfile.degree",
        "studentProfile.educationProgramGroupId",
        "studentProfile.specialty",
        "studentProfile.course",
        "studentProfile.admissionDate",
        "studentProfile.verifiedAt",
        "studentProfile.verificationExpiresAt",

        "university.id",
        "university.name",
        "university.shortName",
        "university.city",
        "university.country",
        "university.status",

        "educationProgramGroup.id",
        "educationProgramGroup.code",
        "educationProgramGroup.nameRu",
        "educationProgramGroup.nameKz",
        "educationProgramGroup.nameEn",
        "educationProgramGroup.degree",
        "educationProgramGroup.isActive",

        "reviewedBy.id",
        "reviewedBy.email",
        "reviewedBy.displayName",
      ])
      .orderBy("verification.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    if (input?.status) {
      query.where("verification.status = :status", {
        status: input.status,
      });
    }

    return query;
  }

  private async getVerificationMetrics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  }> {
    const [pending, approved, rejected, expired] = await Promise.all([
      this.studentVerificationsRepo.count({
        where: { status: StudentVerificationRequestStatus.PENDING },
      }),
      this.studentVerificationsRepo.count({
        where: { status: StudentVerificationRequestStatus.APPROVED },
      }),
      this.studentVerificationsRepo.count({
        where: { status: StudentVerificationRequestStatus.REJECTED },
      }),
      this.studentVerificationsRepo.count({
        where: { status: StudentVerificationRequestStatus.EXPIRED },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      expired,
    };
  }

  private async findVerificationOrThrow(verificationId: string) {
    const verification = await this.studentVerificationsRepo.findOne({
      where: { id: verificationId },
      relations: {
        user: true,
        studentProfile: {
          university: true,
          educationProgramGroup: true,
        },
        reviewedBy: true,
      },
    });

    if (!verification) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Заявка на проверку студента не найдена",
      });
    }

    if (!verification.studentProfile) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Для этой заявки не найден профиль студента",
      });
    }

    return verification;
  }

  public readonly router = t.router({
    list: protectedProcedure
      .input(
        z
          .object({
            status: z
              .enum(["pending", "approved", "rejected", "expired"])
              .optional(),
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const status = input?.status
          ? (input.status as StudentVerificationRequestStatus)
          : undefined;

        const [listResult, metrics] = await Promise.all([
          this.createVerificationListQuery({
            status,
            limit: input?.limit ?? 30,
            offset: input?.offset ?? 0,
          }).getManyAndCount(),
          this.getVerificationMetrics(),
        ]);

        const [items, total] = listResult;

        return {
          total,
          metrics,
          items: items.map((item) => this.mapVerification(item)),
        };
      }),

    getById: protectedProcedure
      .input(
        z.object({
          verificationId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        await this.requireAdminUser(ctx);

        const verification = await this.findVerificationOrThrow(
          input.verificationId
        );

        return this.mapVerification(verification);
      }),

    approve: protectedProcedure
      .input(
        z.object({
          verificationId: z.string().uuid(),
          expiresInDays: z.number().int().min(30).max(1460).default(365),
          reviewComment: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const admin = await this.requireAdminUser(ctx);
        const verification = await this.findVerificationOrThrow(
          input.verificationId
        );

        if (verification.status !== StudentVerificationRequestStatus.PENDING) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Подтвердить можно только заявку со статусом «На проверке»",
          });
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        verification.status = StudentVerificationRequestStatus.APPROVED;
        verification.reviewedByUserId = admin.id;
        verification.reviewedAt = now;
        verification.expiresAt = expiresAt;
        verification.reviewComment = input.reviewComment ?? null;

        await this.studentVerificationsRepo.save(verification);

        const studentProfile = verification.studentProfile;

        studentProfile.verificationStatus = StudentVerificationStatus.VERIFIED;
        studentProfile.verifiedAt = now;
        studentProfile.verificationExpiresAt = expiresAt;

        await this.studentProfilesRepo.save(studentProfile);

        const refreshed = await this.findVerificationOrThrow(verification.id);

        return this.mapVerification(refreshed);
      }),

    reject: protectedProcedure
      .input(
        z.object({
          verificationId: z.string().uuid(),
          reviewComment: z.string().trim().min(2).max(1000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const admin = await this.requireAdminUser(ctx);
        const verification = await this.findVerificationOrThrow(
          input.verificationId
        );

        if (verification.status !== StudentVerificationRequestStatus.PENDING) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Отклонить можно только заявку со статусом «На проверке»",
          });
        }

        const now = new Date();

        verification.status = StudentVerificationRequestStatus.REJECTED;
        verification.reviewedByUserId = admin.id;
        verification.reviewedAt = now;
        verification.expiresAt = null;
        verification.reviewComment = input.reviewComment;

        await this.studentVerificationsRepo.save(verification);

        const studentProfile = verification.studentProfile;

        studentProfile.verificationStatus = StudentVerificationStatus.REJECTED;
        studentProfile.verifiedAt = null;
        studentProfile.verificationExpiresAt = null;

        await this.studentProfilesRepo.save(studentProfile);

        const refreshed = await this.findVerificationOrThrow(verification.id);

        return this.mapVerification(refreshed);
      }),
  });
}