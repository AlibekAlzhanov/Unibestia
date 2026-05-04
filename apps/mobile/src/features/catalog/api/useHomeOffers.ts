import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useHomeOffers() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.getHomeOffers.queryOptions(),
    staleTime: 60 * 1000,
  });
}

