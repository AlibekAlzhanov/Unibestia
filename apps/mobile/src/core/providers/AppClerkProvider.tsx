import type { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/clerk-expo";

import { tokenCache } from "../../shared/auth/tokenCache";
import { env } from "../../shared/config/env";

export function AppClerkProvider({ children }: PropsWithChildren) {
  return (
    <ClerkProvider
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProvider>
  );
}

