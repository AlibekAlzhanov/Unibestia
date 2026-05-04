import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useClaimReferralRewards() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referrals.claimVerifiedReferralRewards.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
