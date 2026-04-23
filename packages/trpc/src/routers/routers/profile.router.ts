import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import {
  Role,
  StudentProfile,
  StudentVerification,
  University,
  User,
  UserRole,
} from "@repo/db";
import { protectedProcedure, t } from "../base/index.js";

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
    private readonly universitiesRepo: Repository<University>
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
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
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
      const studentProfile = await this.studentProfilesRepo.findOne({
        where: { userId: user.id },
      });

      const university = studentProfile?.universityId
        ? await this.universitiesRepo.findOne({
            where: { id: studentProfile.universityId },
          })
        : null;

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
            }
          : null,
      };
    }),

    getMyStudentProfile: protectedProcedure.query(async ({ ctx }) => {
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

      const studentProfile = await this.studentProfilesRepo.findOne({
        where: { userId: user.id },
      });

      if (!studentProfile) {
        return null;
      }

      const university = studentProfile.universityId
        ? await this.universitiesRepo.findOne({
            where: { id: studentProfile.universityId },
          })
        : null;

      const latestVerification = await this.studentVerificationsRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: "DESC" },
      });

      return {
        id: studentProfile.id,
        userId: user.id,
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
      };
    }),
  });
}
