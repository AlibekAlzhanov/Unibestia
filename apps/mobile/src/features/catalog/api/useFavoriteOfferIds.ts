import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useFavoriteOfferIds() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.getFavoriteOfferIds.queryOptions(),
    staleTime: 30 * 1000,
  });
}
