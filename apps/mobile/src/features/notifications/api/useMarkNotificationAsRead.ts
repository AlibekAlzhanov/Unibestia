import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMobileQueries } from "../../../shared/api/invalidateMobileQueries";
import { useTRPC } from "../../../shared/api/trpc";

export function useMarkNotificationAsRead() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.notifications.markAsRead.mutationOptions({
      onSuccess: async () => {
        await invalidateMobileQueries(queryClient, ["notifications"]);
      },
    })
  );
}
