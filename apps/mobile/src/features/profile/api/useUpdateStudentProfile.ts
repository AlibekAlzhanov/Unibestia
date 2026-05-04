import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "../../../shared/api/trpc";

export function useUpdateStudentProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.profile.upsertMyStudentProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    })
  );
}
