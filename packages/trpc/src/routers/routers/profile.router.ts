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

type StudentProfileCompletionField = {
  key:
    | "firstName"
    | "lastName"
    | "phone"
    | "studentEmail"
    | "degree"
    | "specialty"
    | "course"
    | "admissionDate"
    | "university";
  label: string;
  isComplete: boolean;
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

  private normalizeNullableText(value: string | null | undefined): string | null {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private hasValue(value: string | number | null | undefined): boolean {
    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    return Boolean(value?.trim());
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

  private buildProfileCompletion(
    user: User,
    studentProfile: StudentProfile | null,
    domainCheck: {
      isAllowed: boolean;
      university: University | null;
    }
  ) {
    const fields: StudentProfileCompletionField[] = [
      {
        key: "firstName",
        label: "Имя",
        isComplete: this.hasValue(user.firstName),
      },
      {
        key: "lastName",
        label: "Фамилия",
        isComplete: this.hasValue(user.lastName),
      },
      {
        key: "phone",
        label: "Телефон",
        isComplete: this.hasValue(user.phone),
      },
      {
        key: "studentEmail",
        label: "Студенческая почта",
        isComplete: domainCheck.isAllowed,
      },
      {
        key: "university",
        label: "Университет по домену",
        isComplete: Boolean(domainCheck.university),
      },
      {
        key: "degree",
        label: "Степень обучения",
        isComplete: this.hasValue(studentProfile?.degree),
      },
      {
        key: "specialty",
        label: "Специальность",
        isComplete: this.hasValue(studentProfile?.specialty),
      },
      {
        key: "course",
        label: "Курс",
        isComplete: this.hasValue(studentProfile?.course),
      },
      {
        key: "admissionDate",
        label: "Дата поступления",
        isComplete: this.hasValue(studentProfile?.admissionDate),
      },
    ];

    const completedCount = fields.filter((field) => field.isComplete).length;
    const missingFields = fields.filter((field) => !field.isComplete);

    return {
      requiredFields: fields,
      missingFields,
      completedCount,
      totalCount: fields.length,
      percentage: Math.round((completedCount / fields.length) * 100),
      isComplete: missingFields.length === 0,
      canSubmitVerification:
        missingFields.length === 0 &&
        Boolean(studentProfile) &&
        domainCheck.isAllowed,
    };
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

    const profileCompletion = this.buildProfileCompletion(
      user,
      studentProfile,
      domainCheck
    );

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
      profileCompletion,
      studentProfile: studentProfile
        ? {
            id: studentProfile.id,
            universityId: studentProfile.universityId,
            studentEmail: studentProfile.studentEmail,
            degree: studentProfile.degree,
            specialty: studentProfile.specialty,
            course: studentProfile.course,
            admissionDate: studentProfile.admissionDate,
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

  private shouldResetVerificationAfterProfileChange(
    existingUser: User,
    studentProfile: StudentProfile,
    input: {
      firstName?: string;
      lastName?: string;
      degree?: string;
      specialty?: string;
      course?: number;
      admissionDate?: string;
    }
  ): boolean {
    if (studentProfile.verificationStatus !== StudentVerificationStatus.VERIFIED) {
      return false;
    }

    const nextFirstName = this.normalizeNullableText(input.firstName) ?? existingUser.firstName;
    const nextLastName = this.normalizeNullableText(input.lastName) ?? existingUser.lastName;
    const nextDegree =
      this.normalizeNullableText(input.degree) ?? studentProfile.degree;
    const nextSpecialty =
      this.normalizeNullableText(input.specialty) ?? studentProfile.specialty;
    const nextCourse = input.course ?? studentProfile.course;
    const nextAdmissionDate =
      this.normalizeNullableText(input.admissionDate) ??
      studentProfile.admissionDate;

    return (
      nextFirstName !== existingUser.firstName ||
      nextLastName !== existingUser.lastName ||
      nextDegree !== studentProfile.degree ||
      nextSpecialty !== studentProfile.specialty ||
      nextCourse !== studentProfile.course ||
      nextAdmissionDate !== studentProfile.admissionDate
    );
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
          firstName: z.string().trim().min(2).max(100).optional(),
          lastName: z.string().trim().min(2).max(100).optional(),
          displayName: z.string().trim().min(2).max(150).optional(),
          phone: z
            .string()
            .trim()
            .regex(/^\+?[0-9\s()-]{7,30}$/, "Invalid phone format")
            .optional(),
          degree: z.enum(["bachelor", "master", "phd", "other"]).optional(),
          specialty: z.string().trim().min(2).max(150).optional(),
          course: z.number().int().min(1).max(8).optional(),
          admissionDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must use YYYY-MM-DD")
            .optional(),
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

        let studentProfile = await this.studentProfilesRepo.findOne({
          where: { userId: user.id },
        });

        const shouldResetVerification =
          studentProfile
            ? this.shouldResetVerificationAfterProfileChange(
                user,
                studentProfile,
                input
              )
            : false;

        user.firstName = this.normalizeNullableText(input.firstName) ?? user.firstName;
        user.lastName = this.normalizeNullableText(input.lastName) ?? user.lastName;

        const resolvedDisplayName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        user.displayName =
          this.normalizeNullableText(input.displayName) ??
          (resolvedDisplayName || user.displayName);
        user.phone = this.normalizeNullableText(input.phone) ?? user.phone;

        await this.usersRepo.save(user);

        if (!studentProfile) {
          studentProfile = this.studentProfilesRepo.create({
            userId: user.id,
            universityId: allowedUniversity.id,
            studentEmail: user.email,
            degree: this.normalizeNullableText(input.degree),
            specialty: this.normalizeNullableText(input.specialty),
            course: input.course ?? null,
            admissionDate: this.normalizeNullableText(input.admissionDate),
            verificationStatus: StudentVerificationStatus.UNVERIFIED,
            verifiedAt: null,
            verificationExpiresAt: null,
          });
        } else {
          studentProfile.universityId = allowedUniversity.id;
          studentProfile.studentEmail = user.email;
          studentProfile.degree =
            this.normalizeNullableText(input.degree) ?? studentProfile.degree;
          studentProfile.specialty =
            this.normalizeNullableText(input.specialty) ??
            studentProfile.specialty;
          studentProfile.course = input.course ?? studentProfile.course;
          studentProfile.admissionDate =
            this.normalizeNullableText(input.admissionDate) ??
            studentProfile.admissionDate;

          if (
            studentProfile.verificationStatus ===
              StudentVerificationStatus.REJECTED ||
            shouldResetVerification
          ) {
            studentProfile.verificationStatus =
              StudentVerificationStatus.UNVERIFIED;
            studentProfile.verifiedAt = null;
            studentProfile.verificationExpiresAt = null;
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

        const profileCompletion = this.buildProfileCompletion(user, studentProfile, {
          isAllowed: true,
          university: await this.universitiesRepo.findOne({
            where: { id: studentProfile.universityId ?? "" },
          }),
        });

        if (!profileCompletion.isComplete) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Complete required profile fields before verification: ${profileCompletion.missingFields
              .map((field) => field.label)
              .join(", ")}`,
          });
        }

        if (
          studentProfile.verificationStatus ===
          StudentVerificationStatus.PENDING_REVIEW
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Verification request is already pending review",
          });
        }

        if (studentProfile.verificationStatus === StudentVerificationStatus.VERIFIED) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Student profile is already verified",
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
