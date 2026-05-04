import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useUnreadNotificationsCount() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    staleTime: 20 * 1000,
  });
}
