import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import {
  Role,
  StudentProfile,
  StudentVerification,
  StudentVerificationMethod,
  StudentVerificationRequestStatus,
  StudentVerificationStatus,
  University,
  UniversityEmailDomain,
  UniversityStatus,
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
export class ProfileRouter {
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
    private readonly universitiesRepo: Repository<University>,
    @InjectRepository(UniversityEmailDomain)
    private readonly universityEmailDomainsRepo: Repository<UniversityEmailDomain>
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getEmailDomain(email: string): string {
    const normalizedEmail = this.normalizeEmail(email);
    const parts = normalizedEmail.split("@");

    if (parts.length !== 2 || !parts[1]) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid email address",
      });
    }

    return parts[1];
  }

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  private async getOrCreateCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const clerkEmail = ctx.auth.user?.email
      ? this.normalizeEmail(ctx.auth.user.email)
      : null;

    const existingByClerkId = await this.findLocalUserByClerkId(ctx.auth.userId);

    if (existingByClerkId) {
      if (clerkEmail && existingByClerkId.email !== clerkEmail) {
        const userWithClerkEmail = await this.usersRepo.findOne({
          where: { email: clerkEmail },
        });

        if (userWithClerkEmail && userWithClerkEmail.id !== existingByClerkId.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Another local user already exists with current Clerk email",
          });
        }

        existingByClerkId.email = clerkEmail;
      }

      existingByClerkId.firstName =
        ctx.auth.user?.firstName ?? existingByClerkId.firstName;
      existingByClerkId.lastName =
        ctx.auth.user?.lastName ?? existingByClerkId.lastName;
      existingByClerkId.avatarUrl =
        ctx.auth.user?.imageUrl ?? existingByClerkId.avatarUrl;
      existingByClerkId.lastLoginAt = new Date();

      return this.usersRepo.save(existingByClerkId);
    }

    if (!clerkEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Clerk primary email is required",
      });
    }

    const existingByEmail = await this.usersRepo.findOne({
      where: { email: clerkEmail },
    });

    if (existingByEmail) {
      existingByEmail.clerkUserId = ctx.auth.userId;
      existingByEmail.firstName =
        ctx.auth.user?.firstName ?? existingByEmail.firstName;
      existingByEmail.lastName =
        ctx.auth.user?.lastName ?? existingByEmail.lastName;
      existingByEmail.avatarUrl =
        ctx.auth.user?.imageUrl ?? existingByEmail.avatarUrl;
      existingByEmail.lastLoginAt = new Date();

      return this.usersRepo.save(existingByEmail);
    }

    const displayName = [ctx.auth.user?.firstName, ctx.auth.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = this.usersRepo.create({
      clerkUserId: ctx.auth.userId,
      email: clerkEmail,
      firstName: ctx.auth.user?.firstName ?? null,
      lastName: ctx.auth.user?.lastName ?? null,
      displayName: displayName || clerkEmail,
      avatarUrl: ctx.auth.user?.imageUrl ?? null,
      phone: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    });

    return this.usersRepo.save(user);
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

  private async findAllowedStudentEmailDomain(email: string) {
    const domain = this.getEmailDomain(email);

    const emailDomain = await this.universityEmailDomainsRepo.findOne({
      where: {
        domain,
        isActive: true,
      },
      relations: {
        university: true,
      },
    });

    return {
      email,
      domain,
      isAllowed: Boolean(
        emailDomain?.university &&
          emailDomain.university.status === UniversityStatus.ACTIVE
      ),
      university: emailDomain?.university ?? null,
    };
  }

  private async requireAllowedStudentEmailDomain(email: string) {
    const domainCheck = await this.findAllowedStudentEmailDomain(email);

    if (!domainCheck.isAllowed || !domainCheck.university) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Only approved student email domains are allowed. Use your university student email.",
      });
    }

    return domainCheck;
  }

  private async buildProfilePayload(user: User) {
    const roles = await this.getRoleCodesByLocalUserId(user.id);
    const domainCheck = await this.findAllowedStudentEmailDomain(user.email);

    const studentProfile = await this.studentProfilesRepo.findOne({
      where: { userId: user.id },
    });

    const university = studentProfile?.universityId
      ? await this.universitiesRepo.findOne({
          where: { id: studentProfile.universityId },
        })
      : domainCheck.university;

    const latestVerification = await this.studentVerificationsRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: "DESC" },
    });

    return {
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      roles,
      allowedStudentEmailDomain: {
        email: user.email,
        domain: domainCheck.domain,
        isAllowed: domainCheck.isAllowed,
        university: domainCheck.university
          ? {
              id: domainCheck.university.id,
              name: domainCheck.university.name,
              shortName: domainCheck.university.shortName,
              city: domainCheck.university.city,
              country: domainCheck.university.country,
              status: domainCheck.university.status,
            }
          : null,
      },
      studentProfile: studentProfile
        ? {
            id: studentProfile.id,
            universityId: studentProfile.universityId,
            studentEmail: studentProfile.studentEmail,
            studentCardNumber: studentProfile.studentCardNumber,
            faculty: studentProfile.faculty,
            specialty: studentProfile.specialty,
            course: studentProfile.course,
            groupName: studentProfile.groupName,
            verificationStatus: studentProfile.verificationStatus,
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
            latestVerification: latestVerification
              ? {
                  id: latestVerification.id,
                  method: latestVerification.method,
                  status: latestVerification.status,
                  submittedEmail: latestVerification.submittedEmail,
                  documentUrl: latestVerification.documentUrl,
                  documentType: latestVerification.documentType,
                  reviewComment: latestVerification.reviewComment,
                  reviewedByUserId: latestVerification.reviewedByUserId,
                  reviewedAt: latestVerification.reviewedAt,
                  expiresAt: latestVerification.expiresAt,
                  createdAt: latestVerification.createdAt,
                  updatedAt: latestVerification.updatedAt,
                }
              : null,
          }
        : null,
    };
  }

  public readonly router = t.router({
    listUniversities: protectedProcedure.query(async () => {
      const universities = await this.universitiesRepo.find({
        where: { status: UniversityStatus.ACTIVE },
        order: { name: "ASC" },
      });

      return universities.map((university) => ({
        id: university.id,
        name: university.name,
        shortName: university.shortName,
        city: university.city,
        country: university.country,
        status: university.status,
      }));
    }),

    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await this.getOrCreateCurrentUser(ctx);
      return this.buildProfilePayload(user);
    }),

    getMyStudentProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await this.getOrCreateCurrentUser(ctx);
      const payload = await this.buildProfilePayload(user);
      return payload.studentProfile;
    }),

    upsertMyStudentProfile: protectedProcedure
      .input(
        z.object({
          firstName: z.string().trim().min(1).max(100).optional(),
          lastName: z.string().trim().min(1).max(100).optional(),
          displayName: z.string().trim().min(1).max(150).optional(),
          phone: z.string().trim().max(30).optional(),
          studentCardNumber: z.string().trim().max(100).optional(),
          faculty: z.string().trim().max(150).optional(),
          specialty: z.string().trim().max(150).optional(),
          course: z.number().int().min(1).max(8).optional(),
          groupName: z.string().trim().max(50).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.getOrCreateCurrentUser(ctx);
        const domainCheck = await this.requireAllowedStudentEmailDomain(
          user.email
        );
        const allowedUniversity = domainCheck.university;

        if (!allowedUniversity) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Allowed university was not resolved from email domain",
          });
        }

        user.firstName = input.firstName ?? user.firstName;
        user.lastName = input.lastName ?? user.lastName;
        const resolvedDisplayName = [
          input.firstName ?? user.firstName,
          input.lastName ?? user.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        user.displayName =
          input.displayName ?? (resolvedDisplayName || user.displayName);
        user.phone = input.phone ?? user.phone;

        await this.usersRepo.save(user);

        let studentProfile = await this.studentProfilesRepo.findOne({
          where: { userId: user.id },
        });

        if (!studentProfile) {
          studentProfile = this.studentProfilesRepo.create({
            userId: user.id,
            universityId: allowedUniversity.id,
            studentEmail: user.email,
            studentCardNumber: input.studentCardNumber ?? null,
            faculty: input.faculty ?? null,
            specialty: input.specialty ?? null,
            course: input.course ?? null,
            groupName: input.groupName ?? null,
            verificationStatus: StudentVerificationStatus.UNVERIFIED,
            verifiedAt: null,
            verificationExpiresAt: null,
          });
        } else {
          studentProfile.universityId = allowedUniversity.id;
          studentProfile.studentEmail = user.email;
          studentProfile.studentCardNumber =
            input.studentCardNumber ?? studentProfile.studentCardNumber;
          studentProfile.faculty = input.faculty ?? studentProfile.faculty;
          studentProfile.specialty = input.specialty ?? studentProfile.specialty;
          studentProfile.course = input.course ?? studentProfile.course;
          studentProfile.groupName = input.groupName ?? studentProfile.groupName;

          if (
            studentProfile.verificationStatus ===
            StudentVerificationStatus.REJECTED
          ) {
            studentProfile.verificationStatus =
              StudentVerificationStatus.UNVERIFIED;
          }
        }

        await this.studentProfilesRepo.save(studentProfile);

        return this.buildProfilePayload(user);
      }),

    submitStudentVerification: protectedProcedure
      .input(
        z
          .object({
            method: z.literal("edu_email").default("edu_email"),
          })
          .optional()
      )
      .mutation(async ({ ctx }) => {
        const user = await this.getOrCreateCurrentUser(ctx);
        await this.requireAllowedStudentEmailDomain(user.email);

        const studentProfile = await this.studentProfilesRepo.findOne({
          where: { userId: user.id },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fill student profile before verification request",
          });
        }

        const verification = this.studentVerificationsRepo.create({
          userId: user.id,
          studentProfileId: studentProfile.id,
          method: StudentVerificationMethod.EDU_EMAIL,
          status: StudentVerificationRequestStatus.PENDING,
          submittedEmail: user.email,
          documentUrl: null,
          documentType: null,
          reviewComment: null,
          reviewedByUserId: null,
          reviewedAt: null,
          expiresAt: null,
        });

        await this.studentVerificationsRepo.save(verification);

        studentProfile.studentEmail = user.email;
        studentProfile.verificationStatus =
          StudentVerificationStatus.PENDING_REVIEW;
        studentProfile.verifiedAt = null;
        studentProfile.verificationExpiresAt = null;

        await this.studentProfilesRepo.save(studentProfile);

        return this.buildProfilePayload(user);
      }),
  });
}
