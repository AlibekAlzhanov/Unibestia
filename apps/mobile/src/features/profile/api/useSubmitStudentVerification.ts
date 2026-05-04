import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useSubmitStudentVerification() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.profile.submitStudentVerification.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
