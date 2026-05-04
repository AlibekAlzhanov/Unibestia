import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useConfirmQrToken() {
  const trpc = useTRPC();

  return useMutation(trpc.redemptions.confirmByQrToken.mutationOptions());
}
