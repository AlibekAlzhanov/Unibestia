import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useOfferDetails(slug: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.getOfferBySlug.queryOptions({ slug }),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}

