import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useValidateQrToken(qrToken: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.redemptions.validateByQrToken.queryOptions({ qrToken }),
    enabled: Boolean(qrToken),
    retry: false,
  });
}
