import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useCreateReview() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.catalog.createReview.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
