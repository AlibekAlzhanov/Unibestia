import type { Metadata } from "next";
import { type JSX, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { CustomClerkProvider } from "@/providers/clerk-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { AppTRPCProvider } from "@/providers/trpc-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "UniBestie",
  description: "Платформа студенческих скидок, бонусов и привилегий.",
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="ru">
      <body
        className="min-h-screen bg-[#F7F6F1] text-[#17384B]"
        style={{
          fontFamily:
            'Inter, Nunito, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <CustomClerkProvider>
          <PostHogProvider>
            <AppTRPCProvider>
              <div className="min-h-screen">
                <Navbar />
                <main>{children}</main>
              </div>
            </AppTRPCProvider>
          </PostHogProvider>
        </CustomClerkProvider>
      </body>
    </html>
  );
}
