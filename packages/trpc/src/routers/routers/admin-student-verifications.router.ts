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
        message: "Admin access is required",
      });
    }

    return user;
  }

  private mapVerification(item: StudentVerification) {
    const studentProfile = item.studentProfile ?? null;
    const user = item.user ?? null;
    const university = studentProfile?.university ?? null;
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
            specialty: studentProfile.specialty,
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

  private async findVerificationOrThrow(verificationId: string) {
    const verification = await this.studentVerificationsRepo.findOne({
      where: { id: verificationId },
      relations: {
        user: true,
        studentProfile: {
          university: true,
        },
        reviewedBy: true,
      },
    });

    if (!verification) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student verification request not found",
      });
    }

    if (!verification.studentProfile) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Student profile is missing for this verification request",
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

        const where = input?.status
          ? {
              status: input.status as StudentVerificationRequestStatus,
            }
          : {};

        const [items, total] = await this.studentVerificationsRepo.findAndCount({
          where,
          relations: {
            user: true,
            studentProfile: {
              university: true,
            },
            reviewedBy: true,
          },
          order: {
            createdAt: "DESC",
          },
          take: input?.limit ?? 30,
          skip: input?.offset ?? 0,
        });

        const [pendingCount, approvedCount, rejectedCount, expiredCount] =
          await Promise.all([
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
          total,
          metrics: {
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            expired: expiredCount,
          },
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
            message: "Only pending verification requests can be approved",
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
            message: "Only pending verification requests can be rejected",
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
