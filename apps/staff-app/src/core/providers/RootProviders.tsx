import type { PropsWithChildren } from "react";

import { StaffHistoryProvider } from "../history/StaffHistoryContext";
import { AppClerkProvider } from "./AppClerkProvider";
import { AppTRPCProvider } from "./AppTRPCProvider";

export function RootProviders({ children }: PropsWithChildren) {
  return (
    <AppClerkProvider>
      <AppTRPCProvider>
        <StaffHistoryProvider>{children}</StaffHistoryProvider>
      </AppTRPCProvider>
    </AppClerkProvider>
  );
}
