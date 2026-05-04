import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useMyWallet() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.wallet.getMyWallet.queryOptions(),
    staleTime: 30 * 1000,
  });
}
