import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useCategories() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.catalog.listCategories.queryOptions(),
    staleTime: 5 * 60 * 1000,
  });
}
