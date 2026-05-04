import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import {
  PartnerMember,
  PartnerMemberRole,
  StudentProfile,
  StudentVerificationStatus,
  UniversityEmailDomain,
  UniversityStatus,
  User,
  UserRole,
} from "@repo/db";
import { RedemptionsService } from "@repo/domain-services";
import { protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

type QrOperatorContext = {
  operatorUserId: string;
  operatorPartnerId: string | null;
  isAdmin: boolean;
};

@Injectable()
export class RedemptionsRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(PartnerMember)
    private readonly partnerMembersRepo: Repository<PartnerMember>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(UniversityEmailDomain)
    private readonly universityEmailDomainsRepo: Repository<UniversityEmailDomain>,
    private readonly redemptionsService: RedemptionsService
  ) {}

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  private getEmailDomain(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const parts = normalizedEmail.split("@");

    if (parts.length !== 2 || !parts[1]) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid user email",
      });
    }

    return parts[1];
  }

  private async requireVerifiedStudentProfile(user: User): Promise<void> {
    const domain = this.getEmailDomain(user.email);

    const allowedDomain = await this.universityEmailDomainsRepo.findOne({
      where: {
        domain,
        isActive: true,
      },
      relations: {
        university: true,
      },
    });

    if (
      !allowedDomain?.university ||
      allowedDomain.university.status !== UniversityStatus.ACTIVE
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "QR доступен только студентам с разрешённой студенческой почтой.",
      });
    }

    const studentProfile = await this.studentProfilesRepo.findOne({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Заполните профиль студента и отправьте документ на проверку перед получением QR.",
      });
    }

    if (studentProfile.studentEmail !== user.email) {
      studentProfile.studentEmail = user.email;
      studentProfile.universityId = allowedDomain.universityId;
      await this.studentProfilesRepo.save(studentProfile);
    }

    if (studentProfile.verificationStatus === StudentVerificationStatus.PENDING_REVIEW) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Ваш студенческий статус ещё на проверке. QR станет доступен после подтверждения администратором.",
      });
    }

    if (studentProfile.verificationStatus === StudentVerificationStatus.REJECTED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Ваша заявка на подтверждение студенческого статуса отклонена. Обновите данные и отправьте документ повторно.",
      });
    }

    if (studentProfile.verificationStatus === StudentVerificationStatus.EXPIRED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Подтверждение студенческого статуса истекло. Пройдите проверку повторно.",
      });
    }

    if (studentProfile.verificationStatus !== StudentVerificationStatus.VERIFIED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "QR доступен только после подтверждения студенческого статуса администратором.",
      });
    }

    if (
      studentProfile.verificationExpiresAt &&
      studentProfile.verificationExpiresAt.getTime() < Date.now()
    ) {
      studentProfile.verificationStatus = StudentVerificationStatus.EXPIRED;
      await this.studentProfilesRepo.save(studentProfile);

      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Подтверждение студенческого статуса истекло. Пройдите проверку повторно.",
      });
    }
  }

  private async getRoleCodesByLocalUserId(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepo.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles
      .map((userRole) => userRole.role?.code)
      .filter((code): code is string => Boolean(code));
  }

  private async requireQrOperator(ctx: {
    auth: {
      userId: string | null;
    };
  }): Promise<QrOperatorContext> {
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

    const roleCodes = await this.getRoleCodesByLocalUserId(user.id);
    const isAdmin =
      roleCodes.includes("admin") || roleCodes.includes("super_admin");

    if (isAdmin) {
      return {
        operatorUserId: user.id,
        operatorPartnerId: null,
        isAdmin: true,
      };
    }

    const activePartnerMemberships = await this.partnerMembersRepo.find({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    const qrMemberships = activePartnerMemberships.filter((membership) =>
      [
        PartnerMemberRole.OWNER,
        PartnerMemberRole.MANAGER,
        PartnerMemberRole.STAFF,
      ].includes(membership.memberRole)
    );

    if (qrMemberships.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner staff or admin access is required for QR operations",
      });
    }

    if (qrMemberships.length > 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "QR operator has multiple active partner memberships. Only one active partner is allowed.",
      });
    }

    return {
      operatorUserId: user.id,
      operatorPartnerId: qrMemberships[0].partnerId,
      isAdmin: false,
    };
  }

  public readonly router = t.router({
    create: protectedProcedure
      .input(
        z.object({
          offerId: z.string().uuid(),
          locationId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
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

        await this.requireVerifiedStudentProfile(user);

        try {
          return await this.redemptionsService.createRedemption({
            userId: user.id,
            offerId: input.offerId,
            locationId: input.locationId,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create redemption",
          });
        }
      }),

    listMine: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).default(20),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
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

        return this.redemptionsService.listUserRedemptions(
          user.id,
          input?.limit ?? 20,
          input?.offset ?? 0
        );
      }),

    getMineById: protectedProcedure
      .input(
        z.object({
          redemptionId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
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

        try {
          return await this.redemptionsService.getUserRedemptionById(
            user.id,
            input.redemptionId
          );
        } catch (error) {
          if (error instanceof Error && error.message.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load redemption",
          });
        }
      }),

    validateByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(16),
        })
      )
      .query(async ({ ctx, input }) => {
        const operator = await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.validateByQrToken({
            qrToken: input.qrToken,
            ...operator,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate QR token",
          });
        }
      }),

    confirmByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(16),
          locationId: z.string().uuid().optional(),
          orderAmount: z.number().min(0).optional(),
          discountAmount: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const operator = await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.confirmByQrToken({
            qrToken: input.qrToken,
            locationId: input.locationId,
            orderAmount: input.orderAmount,
            discountAmount: input.discountAmount,
            ...operator,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to confirm QR token",
          });
        }
      }),

    cancelByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(16),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const operator = await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.cancelByQrToken({
            qrToken: input.qrToken,
            ...operator,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to cancel QR token",
          });
        }
      }),
  });
}
