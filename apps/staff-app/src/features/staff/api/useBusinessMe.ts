import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useBusinessMe() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.business.auth.getMe.queryOptions(),
    retry: false,
  });
}
