import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useReferralSummary() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.referrals.getMyReferralSummary.queryOptions(),
    staleTime: 30 * 1000,
  });
}
