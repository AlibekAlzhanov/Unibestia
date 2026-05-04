import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 20_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
