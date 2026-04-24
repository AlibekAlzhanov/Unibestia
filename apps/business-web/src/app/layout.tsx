import type { Metadata } from "next";
import { type JSX, type ReactNode } from "react";
import { BusinessClerkProvider } from "@/providers/clerk-provider";
import { BusinessTRPCProvider } from "@/providers/trpc-provider";
import { BusinessNavbar } from "@/components/business-navbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "UniBestia Business",
  description: "Портал сотрудников, партнёров и администраторов UniBestia.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="ru">
      <body
        className="min-h-screen bg-[#F7F6F1] text-[#17384B]"
        style={{
          fontFamily:
            'Inter, Nunito, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <BusinessClerkProvider>
          <BusinessTRPCProvider>
            <div className="min-h-screen">
              <BusinessNavbar />
              <main>{children}</main>
            </div>
          </BusinessTRPCProvider>
        </BusinessClerkProvider>
      </body>
    </html>
  );
}
