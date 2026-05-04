import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useCreateRedemption() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.redemptions.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
