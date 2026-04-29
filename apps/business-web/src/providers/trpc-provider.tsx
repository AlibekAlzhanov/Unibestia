"use client";

import { type JSX, type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuth } from "@clerk/nextjs";
import superjson from "superjson";
import { env } from "@/env";
import { TRPCProvider, type AppRouter } from "@/utils/trpc";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

export function BusinessTRPCProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => makeQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: env.NEXT_PUBLIC_TRPC_URL,
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
        {!env.NEXT_PUBLIC_IS_PRODUCTION && <ReactQueryDevtools />}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
