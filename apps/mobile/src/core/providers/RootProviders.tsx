import type { PropsWithChildren } from "react";

import { AppClerkProvider } from "./AppClerkProvider";
import { AppTRPCProvider } from "./AppTRPCProvider";

export function RootProviders({ children }: PropsWithChildren) {
  return (
    <AppClerkProvider>
      <AppTRPCProvider>{children}</AppTRPCProvider>
    </AppClerkProvider>
  );
}

