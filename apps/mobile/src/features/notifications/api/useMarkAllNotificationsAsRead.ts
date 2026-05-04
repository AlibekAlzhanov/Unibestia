import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMobileQueries } from "../../../shared/api/invalidateMobileQueries";
import { useTRPC } from "../../../shared/api/trpc";

export function useMarkAllNotificationsAsRead() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({
      onSuccess: async () => {
        await invalidateMobileQueries(queryClient, ["notifications"]);
      },
    })
  );
}
