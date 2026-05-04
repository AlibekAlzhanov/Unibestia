import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  type TRPCClient,
} from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "../../shared/api/trpc";
import { TRPCProvider } from "../../shared/api/trpc";
import { createQueryClient } from "../../shared/api/queryClient";
import { env } from "../../shared/config/env";

export function AppTRPCProvider({ children }: PropsWithChildren) {
  const { getToken } = useAuth();

  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: env.EXPO_PUBLIC_TRPC_URL,
          transformer: superjson,
          async headers() {
            const token = await getToken();

            return {
              authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider
        trpcClient={trpcClient as TRPCClient<AppRouter>}
        queryClient={queryClient}
      >
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

