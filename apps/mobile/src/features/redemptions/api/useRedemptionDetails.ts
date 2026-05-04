import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useRedemptionDetails(redemptionId: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.redemptions.getMineById.queryOptions({ redemptionId }),
    enabled: Boolean(redemptionId),
    staleTime: 15 * 1000,
  });
}
