import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useToggleFavorite() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.catalog.toggleFavorite.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
