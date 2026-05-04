import type { PropsWithChildren, ReactElement } from "react";
import { ClerkProvider } from "@clerk/clerk-expo";

import { tokenCache } from "../../shared/auth/tokenCache";
import { env } from "../../shared/config/env";

const ClerkProviderCompat = ClerkProvider as unknown as (
  props: PropsWithChildren<{
    publishableKey: string;
    tokenCache: typeof tokenCache;
  }>
) => ReactElement;

export function AppClerkProvider({ children }: PropsWithChildren) {
  return (
    <ClerkProviderCompat
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProviderCompat>
  );
}