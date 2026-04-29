import { Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CatalogService } from "@repo/domain-services";
import { procedure, t } from "../base/index.js";

const listOffersInputSchema = z
  .object({
    categorySlug: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    featuredOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).default(12),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

@Injectable()
export class CatalogRouter {
  constructor(private readonly catalogService: CatalogService) {}

  public readonly router = t.router({
    listCategories: procedure.query(async () => {
      return this.catalogService.listCategories();
    }),

    getHomeOffers: procedure.query(async () => {
      try {
        const [featuredOffers, newOffers] = await Promise.all([
          this.catalogService.listOffers({
            featuredOnly: true,
            limit: 6,
            offset: 0,
          }),
          this.catalogService.listOffers({
            limit: 6,
            offset: 0,
          }),
        ]);

        return {
          featuredOffers: featuredOffers.items,
          newOffers: newOffers.items,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to load home offers",
        });
      }
    }),

    listOffers: procedure
      .input(listOffersInputSchema)
      .query(async ({ input }) => {
        try {
          return await this.catalogService.listOffers(
            input ?? {
              limit: 12,
              offset: 0,
            }
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
              error instanceof Error ? error.message : "Failed to list offers",
          });
        }
      }),

    getOfferBySlug: procedure
      .input(
        z.object({
          slug: z.string().trim().min(1),
        })
      )
      .query(async ({ input }) => {
        try {
          return await this.catalogService.getOfferBySlug(input.slug);
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
              error instanceof Error ? error.message : "Failed to load offer",
          });
        }
      }),
  });
}