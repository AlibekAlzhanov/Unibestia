import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useCancelQrToken() {
  const trpc = useTRPC();

  return useMutation(trpc.redemptions.cancelByQrToken.mutationOptions());
}
