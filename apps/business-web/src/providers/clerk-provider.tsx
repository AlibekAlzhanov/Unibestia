"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type JSX, type ReactNode } from "react";
import { env } from "@/env";

export function BusinessClerkProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      afterSignInUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    >
      {children}
    </ClerkProvider>
  );
}
