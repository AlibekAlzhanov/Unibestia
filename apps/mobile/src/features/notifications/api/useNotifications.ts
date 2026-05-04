import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

type UseNotificationsParams = {
  unreadOnly?: boolean;
};

export function useNotifications(params: UseNotificationsParams = {}) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.notifications.listMine.queryOptions({
      limit: 50,
      offset: 0,
      unreadOnly: params.unreadOnly || undefined,
    }),
    staleTime: 20 * 1000,
  });
}
