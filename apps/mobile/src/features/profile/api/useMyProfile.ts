import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useMyProfile() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.profile.getMyProfile.queryOptions(),
    staleTime: 60 * 1000,
  });
}
