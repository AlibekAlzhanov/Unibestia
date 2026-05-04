import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useWalletTransactions() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.wallet.getMyTransactions.queryOptions({
      limit: 50,
      offset: 0,
    }),
    staleTime: 30 * 1000,
  });
}
