import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import { Notification, User } from "@repo/db";
import { protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

type AuthContextLike = {
  auth: {
    userId: string | null;
  };
};

function normalizePagination(input?: { limit?: number; offset?: number }) {
  return {
    limit: Math.min(Math.max(input?.limit ?? 30, 1), 100),
    offset: Math.max(input?.offset ?? 0, 0),
  };
}

@Injectable()
export class NotificationsRouter {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  private async requireCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const user = await this.usersRepo.findOne({
      where: {
        clerkUserId: ctx.auth.userId,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Application user not found for current Clerk account",
      });
    }

    return user;
  }

  public readonly router = t.router({
    listMine: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
            unreadOnly: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const user = await this.requireCurrentUser(ctx);
        const { limit, offset } = normalizePagination(input);

        const where = {
          userId: user.id,
          ...(input?.unreadOnly ? { isRead: false } : {}),
        };

        const [items, total] = await this.notificationsRepo.findAndCount({
          where,
          order: {
            createdAt: "DESC",
          },
          take: limit,
          skip: offset,
        });

        const unreadCount = await this.notificationsRepo.count({
          where: {
            userId: user.id,
            isRead: false,
          },
        });

        return {
          total,
          unreadCount,
          limit,
          offset,
          items: items.map((item) => ({
            id: item.id,
            type: item.type,
            channel: item.channel,
            title: item.title,
            body: item.body,
            isRead: item.isRead,
            relatedEntityType: item.relatedEntityType,
            relatedEntityId: item.relatedEntityId,
            sentAt: item.sentAt,
            readAt: item.readAt,
            createdAt: item.createdAt,
          })),
        };
      }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const user = await this.requireCurrentUser(ctx);

      const unreadCount = await this.notificationsRepo.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      return {
        unreadCount,
      };
    }),

    markAsRead: protectedProcedure
      .input(
        z.object({
          notificationId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.requireCurrentUser(ctx);

        const notification = await this.notificationsRepo.findOne({
          where: {
            id: input.notificationId,
            userId: user.id,
          },
        });

        if (!notification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date();
          await this.notificationsRepo.save(notification);
        }

        return {
          id: notification.id,
          isRead: notification.isRead,
          readAt: notification.readAt,
        };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await this.requireCurrentUser(ctx);

      const unreadCount = await this.notificationsRepo.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      if (unreadCount > 0) {
        await this.notificationsRepo.update(
          {
            userId: user.id,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );
      }

      return {
        markedCount: unreadCount,
      };
    }),
  });
}
