import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

type UseOffersParams = {
  search?: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
};

export function useOffers(params: UseOffersParams = {}) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.listOffers.queryOptions({
      search: params.search?.trim() || undefined,
      categorySlug: params.categorySlug,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    }),
    staleTime: 60 * 1000,
  });
}

