import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useMyReviewEligibility(offerId?: string | null) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.getMyReviewEligibility.queryOptions({
      offerId: offerId ?? "",
    }),
    enabled: Boolean(offerId),
  });
}
