import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useApplyReferralCode() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referrals.applyReferralCode.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
